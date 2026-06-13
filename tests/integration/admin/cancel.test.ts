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
  },
}))

vi.mock("@/modules/payment/services/deposit-policy", () => ({
  depositPolicyService: {
    handleCancellation: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendAppointmentCancelled: vi.fn(),
  },
}))

import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { depositPolicyService } from "@/modules/payment/services/deposit-policy"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockWithAdminAuth = vi.mocked(withAdminAuth)
const mockFindFirst = vi.mocked(prisma.appointment.findFirst)
const mockUpdate = vi.mocked(prisma.appointment.update)
const mockHandleCancellation = vi.mocked(depositPolicyService.handleCancellation)
const mockAuditLog = vi.mocked(auditService.log)
const mockSendCancelled = vi.mocked(notificationService.sendAppointmentCancelled)

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
    mockAuditLog.mockResolvedValue(undefined)
    mockSendCancelled.mockResolvedValue(undefined)
    mockHandleCancellation.mockResolvedValue({ refunded: true, stripeRefundId: "re_test_123" })
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

  it("llama a depositPolicyService.handleCancellation con el id y startsAt", async () => {
    const appointment = makeAppointment()
    mockFindFirst.mockResolvedValueOnce(appointment as never)

    await POST(makeRequest(), { params })

    expect(mockHandleCancellation).toHaveBeenCalledWith("apt-1", appointment.startsAt)
  })

  it("retorna 200 con refunded:true y stripeRefundId cuando hay reembolso (≥4 días)", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    const res = await POST(makeRequest(), { params })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toMatchObject({
      appointment: { id: "apt-1", status: "CANCELLED" },
      refunded: true,
      stripeRefundId: "re_test_123",
    })
  })

  it("retorna 200 con refunded:false cuando se retiene el depósito (<4 días)", async () => {
    mockHandleCancellation.mockResolvedValueOnce({ refunded: false, reason: "too_late" })
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    mockFindFirst.mockResolvedValueOnce(makeAppointment({ startsAt: soon }) as never)

    const res = await POST(makeRequest(), { params })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({
      appointment: { id: "apt-1", status: "CANCELLED" },
      refunded: false,
    })
    expect(body.data.stripeRefundId).toBeUndefined()
  })

  it("actualiza el status a CANCELLED en la base de datos", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    await POST(makeRequest(), { params })

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "apt-1" },
      data: { status: "CANCELLED" },
    })
  })

  it("llama a auditService.log con APPOINTMENT_CANCELLED y stripeRefundId cuando hay reembolso", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    await POST(makeRequest(), { params })

    expect(mockAuditLog).toHaveBeenCalledWith(
      "APPOINTMENT_CANCELLED",
      "apt-1",
      expect.objectContaining({
        entityType: "Appointment",
        adminUserId: "admin-1",
        metadata: expect.objectContaining({
          refunded: true,
          stripeRefundId: "re_test_123",
        }),
      })
    )
  })

  it("llama a auditService.log con reason:too_late cuando se retiene el depósito", async () => {
    mockHandleCancellation.mockResolvedValueOnce({ refunded: false, reason: "too_late" })
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    await POST(makeRequest(), { params })

    expect(mockAuditLog).toHaveBeenCalledWith(
      "APPOINTMENT_CANCELLED",
      "apt-1",
      expect.objectContaining({
        metadata: expect.objectContaining({
          refunded: false,
          reason: "too_late",
        }),
      })
    )
  })

  it("envía notificación de cancelación al cliente", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    await POST(makeRequest(), { params })

    expect(mockSendCancelled).toHaveBeenCalledWith("apt-1")
  })

  it("no ejecuta el reembolso si la cita no existe (no llama a depositPolicyService)", async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    await POST(makeRequest(), { params })

    expect(mockHandleCancellation).not.toHaveBeenCalled()
  })
})
