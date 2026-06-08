import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/consultations/route"
import { NextRequest } from "next/server"
import { SlotNotAvailableError, PaymentFailedError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/services/booking-service", () => ({
  bookingService: {
    createConsultation: vi.fn(),
  },
}))

vi.mock("@/modules/payment/services/payment-service", () => ({
  paymentService: {
    createCheckoutSession: vi.fn(),
  },
}))

import { bookingService } from "@/modules/booking/services/booking-service"
import { paymentService } from "@/modules/payment/services/payment-service"

const mockCreateConsultation = vi.mocked(bookingService.createConsultation)
const mockCreateCheckout = vi.mocked(paymentService.createCheckoutSession)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ctx = { params: Promise.resolve({}) }

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/consultations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validBody = {
  name: "Ana García",
  email: "ana@example.com",
  phone: "+34612345678",
  tattooDescription: "Rosa pequeña en muñeca",
  startsAt: "2026-08-01T10:00:00Z",
  endsAt: "2026-08-01T11:00:00Z",
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/consultations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateConsultation.mockResolvedValue({ appointmentId: "appt-001", clientId: "client-001" })
    mockCreateCheckout.mockResolvedValue({ checkoutUrl: "https://checkout.stripe.com/pay/test" })
  })

  it("devuelve 201 con appointmentId y stripeCheckoutUrl cuando los datos son válidos", async () => {
    const res = await POST(makeRequest(validBody), ctx)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({
      appointmentId: "appt-001",
      stripeCheckoutUrl: "https://checkout.stripe.com/pay/test",
    })
  })

  it("llama a bookingService y paymentService con los datos correctos", async () => {
    await POST(makeRequest(validBody), ctx)

    expect(mockCreateConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validBody.name,
        email: validBody.email,
        phone: validBody.phone,
        tattooDescription: validBody.tattooDescription,
      })
    )
    expect(mockCreateCheckout).toHaveBeenCalledWith("appt-001")
  })

  it("devuelve 400 VALIDATION_ERROR si el email es inválido", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "no-es-un-email" }), ctx)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 VALIDATION_ERROR si falta startsAt", async () => {
    const { startsAt: _, ...bodyWithoutStartsAt } = validBody
    const res = await POST(makeRequest(bodyWithoutStartsAt), ctx)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 409 SLOT_NOT_AVAILABLE si el slot está ocupado", async () => {
    mockCreateConsultation.mockRejectedValue(new SlotNotAvailableError())

    const res = await POST(makeRequest(validBody), ctx)

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
  })

  it("devuelve 402 PAYMENT_FAILED si el servicio de pago falla", async () => {
    mockCreateCheckout.mockRejectedValue(new PaymentFailedError())

    const res = await POST(makeRequest(validBody), ctx)

    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("PAYMENT_FAILED")
  })
})
