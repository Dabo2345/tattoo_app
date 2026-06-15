import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { POST } from "@/app/api/admin/appointments/[id]/cancel/route"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/api/middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/middleware")>()
  return {
    ...actual,
    withAdminAuth: vi.fn(
      (handler: (req: unknown, ctx: unknown, session: unknown) => Promise<NextResponse>) =>
        actual.withErrorHandler(async (req, ctx) =>
          handler(req, ctx, { user: { id: "admin-1", email: "admin@example.com" } })
        )
    ),
  }
})

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findAppointmentById: vi.fn(),
    cancelAppointment: vi.fn(),
  },
}))

vi.mock("@/modules/payment/services/deposit-policy", () => ({
  depositPolicyService: {
    handleCancellation: vi.fn(),
  },
}))

vi.mock("@/modules/payment/repositories/payment-repository", () => ({
  paymentRepository: {
    findByAppointmentId: vi.fn(),
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

import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { depositPolicyService } from "@/modules/payment/services/deposit-policy"
import { paymentRepository } from "@/modules/payment/repositories/payment-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockFindAppointmentById = vi.mocked(bookingRepository.findAppointmentById)
const mockCancelAppointment = vi.mocked(bookingRepository.cancelAppointment)
const mockHandleCancellation = vi.mocked(depositPolicyService.handleCancellation)
const mockFindPayment = vi.mocked(paymentRepository.findByAppointmentId)
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
    clientId: "client-1",
    ...overrides,
  }
}

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/appointments/apt-1/cancel", {
    method: "POST",
  })
}

const params = Promise.resolve({ id: "apt-1" })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/appointments/[id]/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: refund eligible (≥4 days)
    mockHandleCancellation.mockResolvedValue({ refunded: true, stripeRefundId: "re_abc123" })
    mockFindPayment.mockResolvedValue({ amount: 50 } as never)
  })

  it("retorna 404 si la cita no existe", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(null)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("retorna 409 si la cita ya está cancelada", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment({ status: "CANCELLED" }) as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("ALREADY_CANCELLED")
  })

  it("retorna 409 si la cita está completada", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment({ status: "COMPLETED" }) as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("ALREADY_CANCELLED")
  })

  it("retorna 409 si la cita tiene estado NO_SHOW", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment({ status: "NO_SHOW" }) as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("ALREADY_CANCELLED")
  })

  it("retorna 200 con refunded=true y refundAmount cuando procede el reembolso", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.refunded).toBe(true)
    expect(body.data.refundAmount).toBe(50)
    expect(body.data.appointment.status).toBe("CANCELLED")
  })

  it("retorna 200 con refunded=false cuando no procede el reembolso", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockHandleCancellation.mockResolvedValueOnce({ refunded: false, reason: "too_late" })

    const res = await POST(makeRequest(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.refunded).toBe(false)
    expect(body.data.refundAmount).toBe(0)
  })

  it("llama a depositPolicyService.handleCancellation con el id y startsAt de la cita", async () => {
    const appointment = makeAppointment()
    mockFindAppointmentById.mockResolvedValueOnce(appointment as never)

    await POST(makeRequest(), { params })

    expect(mockHandleCancellation).toHaveBeenCalledWith("apt-1", appointment.startsAt)
  })

  it("cancela el appointment en el repositorio", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    await POST(makeRequest(), { params })
    expect(mockCancelAppointment).toHaveBeenCalledWith("apt-1")
  })

  it("crea un AuditLog con la acción APPOINTMENT_CANCELLED y stripeRefundId cuando hay reembolso", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    await POST(makeRequest(), { params })
    expect(mockAuditLog).toHaveBeenCalledWith(
      "APPOINTMENT_CANCELLED",
      "apt-1",
      expect.objectContaining({
        entityType: "Appointment",
        adminUserId: "admin-1",
        metadata: expect.objectContaining({
          refunded: true,
          stripeRefundId: "re_abc123",
        }),
      })
    )
  })

  it("crea AuditLog sin stripeRefundId cuando no hay reembolso", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockHandleCancellation.mockResolvedValueOnce({ refunded: false, reason: "too_late" })

    await POST(makeRequest(), { params })
    expect(mockAuditLog).toHaveBeenCalledWith(
      "APPOINTMENT_CANCELLED",
      "apt-1",
      expect.objectContaining({
        metadata: expect.not.objectContaining({ stripeRefundId: expect.anything() }),
      })
    )
  })

  it("envía notificación de cancelación", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    await POST(makeRequest(), { params })
    expect(mockSendCancelled).toHaveBeenCalledWith("apt-1")
  })
})
