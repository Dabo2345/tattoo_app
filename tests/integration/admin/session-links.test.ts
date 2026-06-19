import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/session-links/route"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  withAdminAuth: vi.fn(async (_req: Request, handler: (s: unknown) => Promise<Response>) =>
    handler({ user: { id: "admin-1", email: "admin@example.com" } })
  ),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
    },
    sessionLink: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendSessionLink: vi.fn(),
  },
}))

import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const mockFindFirst = vi.mocked(prisma.appointment.findFirst)
const mockFindUnique = vi.mocked(prisma.sessionLink.findUnique)
const mockCreate = vi.mocked(prisma.sessionLink.create)
const mockAuditCreate = vi.mocked(prisma.auditLog.create)
const mockWithAdminAuth = vi.mocked(withAdminAuth)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const consultation = {
  id: "appt-1",
  type: "CONSULTATION",
  status: "CONFIRMED",
  startsAt: new Date("2026-08-01T10:00:00.000Z"),
  endsAt: new Date("2026-08-01T11:00:00.000Z"),
  deletedAt: null,
}

const createdSessionLink = {
  id: "sl-1",
  appointmentId: "appt-1",
  tokenHash: "hash-abc",
  expiresAt: new Date("2026-08-31T10:00:00.000Z"),
  sessionDurationMinutes: 120,
  artistNotes: "Traer referencia",
  usedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/session-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/session-links", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFindFirst.mockResolvedValue(consultation as never)
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue(createdSessionLink as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )
    const res = await POST(makePostRequest({ consultationId: "appt-1", durationMinutes: 120 }))
    expect(res.status).toBe(401)
  })

  it("retorna 400 si falta consultationId", async () => {
    const res = await POST(makePostRequest({ durationMinutes: 120 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si durationMinutes es menor que 30", async () => {
    const res = await POST(makePostRequest({ consultationId: "appt-1", durationMinutes: 15 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si durationMinutes es mayor que 480", async () => {
    const res = await POST(makePostRequest({ consultationId: "appt-1", durationMinutes: 600 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si durationMinutes no es un número", async () => {
    const res = await POST(
      makePostRequest({ consultationId: "appt-1", durationMinutes: "dos horas" })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 404 si la consulta no existe", async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const res = await POST(makePostRequest({ consultationId: "nonexistent", durationMinutes: 120 }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("retorna 409 si la cita no es de tipo CONSULTATION", async () => {
    mockFindFirst.mockResolvedValueOnce({
      ...consultation,
      type: "TATTOO_SESSION",
    } as never)
    const res = await POST(makePostRequest({ consultationId: "appt-1", durationMinutes: 120 }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("INVALID_STATUS")
  })

  it("retorna 409 si la consulta está en estado no permitido (PENDING_PAYMENT)", async () => {
    mockFindFirst.mockResolvedValueOnce({
      ...consultation,
      status: "PENDING_PAYMENT",
    } as never)
    const res = await POST(makePostRequest({ consultationId: "appt-1", durationMinutes: 120 }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("INVALID_STATUS")
  })

  it("retorna 409 si ya existe un SessionLink para la consulta", async () => {
    mockFindUnique.mockResolvedValueOnce(createdSessionLink as never)
    const res = await POST(makePostRequest({ consultationId: "appt-1", durationMinutes: 120 }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("ALREADY_EXISTS")
  })

  it("retorna 200 con el sessionLink generado", async () => {
    const res = await POST(
      makePostRequest({ consultationId: "appt-1", durationMinutes: 120, notes: "Traer referencia" })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.sessionLink.id).toBe("sl-1")
    expect(body.data.sessionLink.url).toMatch(
      /^http:\/\/localhost:3000\/session-link\/[a-f0-9]{64}$/
    )
    expect(body.data.sessionLink.sessionDurationMinutes).toBe(120)
  })

  it("llama a prisma.sessionLink.create con los valores correctos", async () => {
    await POST(
      makePostRequest({ consultationId: "appt-1", durationMinutes: 120, notes: "Traer referencia" })
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: "appt-1",
          sessionDurationMinutes: 120,
          artistNotes: "Traer referencia",
        }),
      })
    )
  })

  it("crea un AuditLog con acción SESSION_LINK_GENERATED", async () => {
    await POST(makePostRequest({ consultationId: "appt-1", durationMinutes: 120 }))
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "SESSION_LINK_GENERATED",
          entityId: "sl-1",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})
