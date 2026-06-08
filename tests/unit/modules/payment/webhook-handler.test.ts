import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock("@/modules/payment/repositories/payment-repository", () => ({
  paymentRepository: {
    findByAppointmentId: vi.fn(),
    findByPaymentIntentId: vi.fn(),
    confirmPayment: vi.fn(),
    refundPayment: vi.fn(),
  },
}))

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    createAuditLog: vi.fn(),
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/sentry", () => ({
  captureException: vi.fn(),
}))

import { POST } from "@/app/api/webhooks/stripe/route"
import { stripe } from "@/lib/stripe/client"
import { paymentRepository } from "@/modules/payment/repositories/payment-repository"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import type { NextRequest } from "next/server"

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent)
const mockFindByAppointmentId = vi.mocked(paymentRepository.findByAppointmentId)
const mockFindByPaymentIntentId = vi.mocked(paymentRepository.findByPaymentIntentId)
const mockConfirmPayment = vi.mocked(paymentRepository.confirmPayment)
const mockRefundPayment = vi.mocked(paymentRepository.refundPayment)
const mockCreateAuditLog = vi.mocked(bookingRepository.createAuditLog)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRequest(body = "{}", signature = "valid-sig"): NextRequest {
  return {
    headers: {
      get: (key: string) => (key === "stripe-signature" ? signature : null),
    },
    text: async () => body,
  } as unknown as NextRequest
}

function buildCheckoutEvent(appointmentId: string, sessionId = "cs_test_123") {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        metadata: { appointmentId },
      },
    },
  }
}

function buildChargeRefundedEvent(paymentIntentId: string) {
  return {
    type: "charge.refunded",
    data: {
      object: {
        id: "ch_test_456",
        payment_intent: paymentIntentId,
      },
    },
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("devuelve 400 si falta el header stripe-signature", async () => {
    const req = buildRequest("{}", null as unknown as string)
    // Override headers.get to return null
    const reqNoSig = {
      ...req,
      headers: { get: () => null },
      text: async () => "{}",
    } as unknown as NextRequest

    const res = await POST(reqNoSig)
    expect(res.status).toBe(400)
  })

  it("devuelve 400 si la firma es inválida", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature")
    })

    const req = buildRequest()
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(mockConfirmPayment).not.toHaveBeenCalled()
  })

  it("confirma el appointment y crea AuditLog en checkout.session.completed", async () => {
    const appointmentId = "appt-001"
    mockConstructEvent.mockReturnValue(buildCheckoutEvent(appointmentId) as never)
    mockFindByAppointmentId.mockResolvedValue({ status: "PENDING" } as never)
    mockConfirmPayment.mockResolvedValue([{ count: 1 }, { count: 1 }] as never)
    mockCreateAuditLog.mockResolvedValue({} as never)

    const req = buildRequest()
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockConfirmPayment).toHaveBeenCalledWith(appointmentId)
    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CONSULTATION_CONFIRMED",
        entityId: appointmentId,
        entityType: "Appointment",
      })
    )
  })

  it("es idempotente: no vuelve a confirmar si el pago ya es PAID", async () => {
    const appointmentId = "appt-001"
    mockConstructEvent.mockReturnValue(buildCheckoutEvent(appointmentId) as never)
    mockFindByAppointmentId.mockResolvedValue({ status: "PAID" } as never)

    const req = buildRequest()
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockConfirmPayment).not.toHaveBeenCalled()
    expect(mockCreateAuditLog).not.toHaveBeenCalled()
  })

  it("responde 200 en eventos desconocidos sin modificar datos", async () => {
    mockConstructEvent.mockReturnValue({ type: "customer.created", data: { object: {} } } as never)

    const req = buildRequest()
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockConfirmPayment).not.toHaveBeenCalled()
  })

  it("marca el payment como REFUNDED en charge.refunded", async () => {
    const paymentIntentId = "pi_test_456"
    const appointmentId = "appt-001"
    mockConstructEvent.mockReturnValue(buildChargeRefundedEvent(paymentIntentId) as never)
    mockFindByPaymentIntentId.mockResolvedValue({ appointmentId } as never)
    mockRefundPayment.mockResolvedValue({ count: 1 } as never)

    const req = buildRequest()
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockRefundPayment).toHaveBeenCalledWith(appointmentId)
  })

  it("responde 200 aunque el handler interno falle (evita reintentos de Stripe)", async () => {
    const appointmentId = "appt-001"
    mockConstructEvent.mockReturnValue(buildCheckoutEvent(appointmentId) as never)
    mockFindByAppointmentId.mockRejectedValue(new Error("DB connection lost"))

    const req = buildRequest()
    const res = await POST(req)

    expect(res.status).toBe(200)
  })
})
