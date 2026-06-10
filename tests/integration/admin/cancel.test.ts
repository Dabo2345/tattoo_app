import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/appointments/[id]/cancel/route"

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
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const mockFindFirst = vi.mocked(prisma.appointment.findFirst)
const mockUpdate = vi.mocked(prisma.appointment.update)
const mockAuditCreate = vi.mocked(prisma.auditLog.create)
const mockWithAdminAuth = vi.mocked(withAdminAuth)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: "apt-1",
    type: "CONSULTATION",
    status: "CONFIRMED",
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    ...overrides,
  }
}

function makeRequest() {
  return new Request("http://localhost:3000/api/admin/appointments/apt-1/cancel", {
    method: "POST",
  })
}

const params = Promise.resolve({ id: "apt-1" })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/appointments/[id]/cancel", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockUpdate.mockResolvedValue({} as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(401)
  })

  it("retorna 404 si la cita no existe", async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("retorna 409 si la cita ya está cancelada", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment({ status: "CANCELLED" }) as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("ALREADY_CANCELLED")
  })

  it("retorna 409 si la cita está completada", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment({ status: "COMPLETED" }) as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("ALREADY_CANCELLED")
  })

  it("retorna 200 con refundEligible=true cuando la cita es en 7 días", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.refundEligible).toBe(true)
    expect(body.data.appointment.status).toBe("CANCELLED")
  })

  it("retorna 200 con refundEligible=false cuando la cita es en menos de 4 días", async () => {
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    mockFindFirst.mockResolvedValueOnce(makeAppointment({ startsAt: soon }) as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.refundEligible).toBe(false)
  })

  it("actualiza el status a CANCELLED en la base de datos", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)
    await POST(makeRequest(), { params })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "apt-1" },
      data: { status: "CANCELLED" },
    })
  })

  it("crea un AuditLog con la acción APPOINTMENT_CANCELLED", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)
    await POST(makeRequest(), { params })
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "APPOINTMENT_CANCELLED",
          entityId: "apt-1",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})
