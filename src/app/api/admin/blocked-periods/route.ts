import { z } from "zod"
import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// ─── GET ──────────────────────────────────────────────────────────────────────

const getQuerySchema = z.object({
  from: z.string().datetime({ message: "'from' debe ser una fecha ISO válida" }).optional(),
  to: z.string().datetime({ message: "'to' debe ser una fecha ISO válida" }).optional(),
})

export async function GET(request: Request) {
  return withAdminAuth(request, async () => {
    const { searchParams } = new URL(request.url)

    const parsed = getQuerySchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message } },
        { status: 400 }
      )
    }

    const { from, to } = parsed.data

    const blockedPeriods = await prisma.blockedPeriod.findMany({
      where:
        from || to
          ? {
              AND: [
                ...(from ? [{ endsAt: { gte: new Date(from) } }] : []),
                ...(to ? [{ startsAt: { lte: new Date(to) } }] : []),
              ],
            }
          : undefined,
      select: { id: true, startsAt: true, endsAt: true, reason: true },
      orderBy: { startsAt: "asc" },
    })

    return Response.json({
      success: true,
      data: {
        blockedPeriods: blockedPeriods.map((p) => ({
          id: p.id,
          startsAt: p.startsAt.toISOString(),
          endsAt: p.endsAt.toISOString(),
          reason: p.reason,
        })),
      },
    })
  })
}

// ─── POST ─────────────────────────────────────────────────────────────────────

const postBodySchema = z
  .object({
    startsAt: z.string().datetime({ message: "'startsAt' debe ser una fecha ISO válida" }),
    endsAt: z.string().datetime({ message: "'endsAt' debe ser una fecha ISO válida" }),
    reason: z.string().max(500).optional(),
  })
  .refine((data) => new Date(data.startsAt) < new Date(data.endsAt), {
    message: "'startsAt' debe ser anterior a 'endsAt'",
    path: ["startsAt"],
  })

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

    const { startsAt, endsAt, reason } = parsed.data

    const blockedPeriod = await prisma.blockedPeriod.create({
      data: {
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        reason: reason ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: "BLOCKED_PERIOD_CREATED",
        entityId: blockedPeriod.id,
        entityType: "BlockedPeriod",
        adminUserId: session.user.id,
        metadata: { startsAt, endsAt, reason: reason ?? null },
      },
    })

    return Response.json({
      success: true,
      data: {
        blockedPeriod: {
          id: blockedPeriod.id,
          startsAt: blockedPeriod.startsAt.toISOString(),
          endsAt: blockedPeriod.endsAt.toISOString(),
          reason: blockedPeriod.reason,
        },
      },
    })
  })
}
