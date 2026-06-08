import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHash } from "crypto"
import { POST } from "@/app/api/appointments/[id]/cancel/route"
import { NextRequest } from "next/server"
import { AppointmentNotFoundError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findMagicLinkByHash: vi.fn(),
    findAppointmentById: vi.fn(),
    cancelAppointment: vi.fn(),
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

import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { depositPolicyService } from "@/modules/payment/services/deposit-policy"
import { auditService } from "@/modules/audit/services/audit-service"

const mockFindMagicLink = vi.mocked(bookingRepository.findMagicLinkByHash)
const mockFindAppointment = vi.mocked(bookingRepository.findAppointmentById)
const mockCancelAppointment = vi.mocked(bookingRepository.cancelAppointment)
const mockAuditLog = vi.mocked(auditService.log)
const mockHandleCancellation = vi.mocked(depositPolicyService.handleCancellation)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const appointmentId = "appt-001"
const rawToken = "secure-token-abc123"
const tokenHash = createHash("sha256").update(rawToken).digest("hex")

const futureDateDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

const mockMagicLink = {
  id: "ml-001",
  appointmentId,
  tokenHash,
  expiresAt: futureDateDays(7),
  purpose: "MANAGE_APPOINTMENT",
}

const mockAppointment = {
  id: appointmentId,
  clientId: "client-001",
  status: "CONFIRMED",
  startsAt: futureDateDays(10),
  depositAmount: 50,
}

const ctx = { params: Promise.resolve({ id: appointmentId }) }

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/appointments/${appointmentId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/appointments/:id/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMagicLink.mockResolvedValue(mockMagicLink as never)
    mockFindAppointment.mockResolvedValue(mockAppointment as never)
    mockCancelAppointment.mockResolvedValue(mockAppointment as never)
    mockAuditLog.mockResolvedValue(undefined)
    mockHandleCancellation.mockResolvedValue({ refunded: true, stripeRefundId: "re_test_123" })
  })

  it("cancela la cita y devuelve refunded: true cuando procede reembolso", async () => {
    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ cancelled: true, refunded: true, refundAmount: 50 })
    expect(mockCancelAppointment).toHaveBeenCalledWith(appointmentId)
  })

  it("cancela y devuelve refunded: false cuando se retiene el depósito", async () => {
    mockHandleCancellation.mockResolvedValue({ refunded: false, reason: "too_late" })

    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ cancelled: true, refunded: false, refundAmount: 0 })
  })

  it("devuelve 410 si el magic link no existe", async () => {
    mockFindMagicLink.mockResolvedValue(null)

    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.error.code).toBe("LINK_EXPIRED")
  })

  it("devuelve 410 si el magic link está expirado", async () => {
    mockFindMagicLink.mockResolvedValue({
      ...mockMagicLink,
      expiresAt: new Date(Date.now() - 1000),
    } as never)

    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(410)
  })

  it("devuelve 410 si el token no corresponde al appointment", async () => {
    mockFindMagicLink.mockResolvedValue({
      ...mockMagicLink,
      appointmentId: "otro-appointment",
    } as never)

    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(410)
  })

  it("devuelve 404 si el appointment no existe", async () => {
    mockFindAppointment.mockRejectedValue(new AppointmentNotFoundError())

    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(404)
  })

  it("devuelve 400 si falta magicLinkToken", async () => {
    const res = await POST(makeRequest({}), ctx)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("responde idempotente si la cita ya está CANCELLED", async () => {
    mockFindAppointment.mockResolvedValue({
      ...mockAppointment,
      status: "CANCELLED",
    } as never)

    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(200)
    expect(mockHandleCancellation).not.toHaveBeenCalled()
    expect(mockCancelAppointment).not.toHaveBeenCalled()
  })

  it("crea AuditLog APPOINTMENT_CANCELLED con el resultado del reembolso", async () => {
    await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(mockAuditLog).toHaveBeenCalledWith(
      "APPOINTMENT_CANCELLED",
      appointmentId,
      expect.objectContaining({ entityType: "Appointment" })
    )
  })
})
