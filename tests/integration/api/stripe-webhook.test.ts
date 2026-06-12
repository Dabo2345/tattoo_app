import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/webhooks/stripe/route"
import { NextRequest } from "next/server"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
  },
}))

vi.mock("@/modules/payment/repositories/payment-repository", () => ({
  paymentRepository: {
    findByAppointmentId: vi.fn(),
    confirmPayment: vi.fn(),
    findByPaymentIntentId: vi.fn(),
    refundPayment: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendConsultationConfirmed: vi.fn(),
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/sentry", () => ({
  captureException: vi.fn(),
}))

import { stripe } from "@/lib/stripe/client"
import { paymentRepository } from "@/modules/payment/repositories/payment-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent)
const mockFindByAppointmentId = vi.mocked(paymentRepository.findByAppointmentId)
const mockConfirmPayment = vi.mocked(paymentRepository.confirmPayment)
const mockFindByPaymentIntentId = vi.mocked(paymentRepository.findByPaymentIntentId)
const mockRefundPayment = vi.mocked(paymentRepository.refundPayment)
const mockAuditLog = vi.mocked(auditService.log)
const mockSendConsultationConfirmed = vi.mocked(notificationService.sendConsultationConfirmed)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body = "{}", withSignature = true): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(withSignature ? { "stripe-signature": "t=123,v1=fake_sig" } : {}),
    },
    body,
  })
}

function makeCheckoutEvent(metadataOverrides: Record<string, string> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        payment_intent: "pi_test_123",
        metadata: { appointmentId: "appt-001", ...metadataOverrides },
      },
    },
  } as never
}

function makeRefundEvent(paymentIntentOverride?: string | null) {
  return {
    type: "charge.refunded",
    data: {
      object: {
        id: "ch_test_123",
        payment_intent: paymentIntentOverride !== undefined ? paymentIntentOverride : "pi_test_123",
      },
    },
  } as never
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindByAppointmentId.mockResolvedValue(null)
    mockConfirmPayment.mockResolvedValue([{ count: 1 }, { count: 1 }] as never)
    mockAuditLog.mockResolvedValue(undefined)
    mockSendConsultationConfirmed.mockResolvedValue(undefined)
    mockFindByPaymentIntentId.mockResolvedValue({
      id: "pay-001",
      appointmentId: "appt-001",
      stripePaymentIntentId: "pi_test_123",
      amount: 50,
      status: "PAID",
    } as never)
    mockRefundPayment.mockResolvedValue({ count: 1 } as never)
  })

  // ─── Auth ─────────────────────────────────────────────────────────────────

  it("devuelve 400 cuando falta el header stripe-signature", async () => {
    const res = await POST(makeRequest("{}", false))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("stripe-signature")
  })

  it("devuelve 400 cuando la firma de Stripe es inválida", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Webhook signature verification failed")
    })

    const res = await POST(makeRequest())

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("signature")
  })

  // ─── checkout.session.completed ───────────────────────────────────────────

  it("checkout.session.completed: confirma pago y devuelve { received: true }", async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent())

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(mockConfirmPayment).toHaveBeenCalledWith("appt-001", "pi_test_123")
  })

  it("checkout.session.completed: crea AuditLog CONSULTATION_CONFIRMED", async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent())

    await POST(makeRequest())

    expect(mockAuditLog).toHaveBeenCalledWith(
      "CONSULTATION_CONFIRMED",
      "appt-001",
      expect.objectContaining({ entityType: "Appointment" })
    )
  })

  it("checkout.session.completed: llama sendConsultationConfirmed tras confirmar pago", async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent())

    await POST(makeRequest())

    expect(mockSendConsultationConfirmed).toHaveBeenCalledWith("appt-001")
  })

  it("checkout.session.completed: es idempotente si el pago ya está PAID", async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent())
    mockFindByAppointmentId.mockResolvedValue({ status: "PAID" } as never)

    await POST(makeRequest())

    expect(mockConfirmPayment).not.toHaveBeenCalled()
    expect(mockSendConsultationConfirmed).not.toHaveBeenCalled()
  })

  it("checkout.session.completed: sin appointmentId en metadata → devuelve 200 sin confirmar", async () => {
    mockConstructEvent.mockReturnValue(
      makeCheckoutEvent({ appointmentId: undefined as unknown as string })
    )

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(mockConfirmPayment).not.toHaveBeenCalled()
    expect(mockSendConsultationConfirmed).not.toHaveBeenCalled()
  })

  // ─── charge.refunded ──────────────────────────────────────────────────────

  it("charge.refunded: marca el Payment como REFUNDED", async () => {
    mockConstructEvent.mockReturnValue(makeRefundEvent())

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(mockRefundPayment).toHaveBeenCalledWith("appt-001")
  })

  it("charge.refunded: sin payment_intent → devuelve 200 sin marcar refund", async () => {
    mockConstructEvent.mockReturnValue(makeRefundEvent(null))

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(mockRefundPayment).not.toHaveBeenCalled()
  })

  // ─── Eventos desconocidos ─────────────────────────────────────────────────

  it("evento desconocido → devuelve 200 { received: true } sin procesar", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.created",
      data: { object: {} },
    } as never)

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(mockConfirmPayment).not.toHaveBeenCalled()
  })
})
