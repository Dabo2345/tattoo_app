import { createHash, randomBytes } from "crypto"
import { z } from "zod"
import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_CONSULTATION_STATUSES = ["CONFIRMED", "COMPLETED"] as const
const SESSION_LINK_EXPIRY_DAYS = 30

// ─── Schema ───────────────────────────────────────────────────────────────────

const postBodySchema = z.object({
  consultationId: z.string().min(1, "'consultationId' es requerido"),
  durationMinutes: z
    .number({ error: "'durationMinutes' debe ser un número" })
    .int("'durationMinutes' debe ser un entero")
    .min(30, "'durationMinutes' mínimo es 30")
    .max(480, "'durationMinutes' máximo es 480"),
  notes: z.string().max(1000).optional(),
})

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  return withAdminAuth(request, async (session) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Body inválido" } },
        { status: 400 }
      )
    }

    const parsed = postBodySchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message } },
        { status: 400 }
      )
    }

    const { consultationId, durationMinutes, notes } = parsed.data

    // ── Verify consultation exists ────────────────────────────────────────────
    const consultation = await prisma.appointment.findFirst({
      where: { id: consultationId, deletedAt: null },
    })

    if (!consultation) {
      return Response.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Consulta no encontrada" },
        },
        { status: 404 }
      )
    }

    // ── Verify it's a CONSULTATION type ──────────────────────────────────────
    if (consultation.type !== "CONSULTATION") {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Solo se pueden generar SessionLinks para consultas",
          },
        },
        { status: 409 }
      )
    }

    // ── Verify consultation status ────────────────────────────────────────────
    if (
      !VALID_CONSULTATION_STATUSES.includes(
        consultation.status as (typeof VALID_CONSULTATION_STATUSES)[number]
      )
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: `La consulta debe estar en estado ${VALID_CONSULTATION_STATUSES.join(" o ")} para generar un SessionLink`,
          },
        },
        { status: 409 }
      )
    }

    // ── Check for existing SessionLink ────────────────────────────────────────
    const existing = await prisma.sessionLink.findUnique({
      where: { appointmentId: consultationId },
    })

    if (existing) {
      return Response.json(
        {
          success: false,
          error: {
            code: "ALREADY_EXISTS",
            message: "Ya existe un SessionLink para esta consulta",
          },
        },
        { status: 409 }
      )
    }

    // ── Generate token ────────────────────────────────────────────────────────
    const token = randomBytes(32).toString("hex")
    const tokenHash = createHash("sha256").update(token).digest("hex")

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_LINK_EXPIRY_DAYS)

    // ── Create SessionLink ────────────────────────────────────────────────────
    const sessionLink = await prisma.sessionLink.create({
      data: {
        appointmentId: consultationId,
        tokenHash,
        expiresAt,
        sessionDurationMinutes: durationMinutes,
        artistNotes: notes ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: "SESSION_LINK_GENERATED",
        entityId: sessionLink.id,
        entityType: "SessionLink",
        adminUserId: session.user.id,
        metadata: {
          consultationId,
          durationMinutes,
          expiresAt: expiresAt.toISOString(),
        },
      },
    })

    const linkUrl = `${env.NEXT_PUBLIC_APP_URL}/book/${token}`

    return Response.json({
      success: true,
      data: {
        sessionLink: {
          id: sessionLink.id,
          url: linkUrl,
          expiresAt: sessionLink.expiresAt.toISOString(),
          sessionDurationMinutes: sessionLink.sessionDurationMinutes,
          artistNotes: sessionLink.artistNotes,
        },
      },
    })
  })
}
