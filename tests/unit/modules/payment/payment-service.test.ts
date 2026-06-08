import { describe, it, expect, vi, beforeEach } from "vitest"
import { PaymentFailedError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

vi.mock("@/modules/payment/repositories/payment-repository", () => ({
  paymentRepository: {
    createPayment: vi.fn(),
  },
}))

import { stripe } from "@/lib/stripe/client"
import { paymentRepository } from "@/modules/payment/repositories/payment-repository"
import { paymentService } from "@/modules/payment/services/payment-service"

const mockSessionCreate = vi.mocked(stripe.checkout.sessions.create)
const mockCreatePayment = vi.mocked(paymentRepository.createPayment)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const appointmentId = "appt-001"
const mockSession = {
  id: "cs_test_123",
  url: "https://checkout.stripe.com/pay/cs_test_123",
  payment_intent: "pi_test_456",
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("paymentService.createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionCreate.mockResolvedValue(mockSession as never)
    mockCreatePayment.mockResolvedValue({} as never)
  })

  it("devuelve checkoutUrl cuando Stripe responde correctamente", async () => {
    const result = await paymentService.createCheckoutSession(appointmentId)

    expect(result).toEqual({ checkoutUrl: mockSession.url })
  })

  it("crea el Payment con stripePaymentIntentId, amount y status PENDING", async () => {
    await paymentService.createCheckoutSession(appointmentId)

    expect(mockCreatePayment).toHaveBeenCalledWith({
      appointmentId,
      stripePaymentIntentId: mockSession.payment_intent,
      amount: 50,
    })
  })

  it("lanza PaymentFailedError si Stripe lanza una excepción", async () => {
    mockSessionCreate.mockRejectedValue(new Error("Stripe network error"))

    await expect(paymentService.createCheckoutSession(appointmentId)).rejects.toThrow(
      PaymentFailedError
    )
    expect(mockCreatePayment).not.toHaveBeenCalled()
  })

  it("lanza PaymentFailedError si la session no tiene URL", async () => {
    mockSessionCreate.mockResolvedValue({ ...mockSession, url: null } as never)

    await expect(paymentService.createCheckoutSession(appointmentId)).rejects.toThrow(
      PaymentFailedError
    )
  })

  it("lanza PaymentFailedError si la session no tiene payment_intent", async () => {
    mockSessionCreate.mockResolvedValue({ ...mockSession, payment_intent: null } as never)

    await expect(paymentService.createCheckoutSession(appointmentId)).rejects.toThrow(
      PaymentFailedError
    )
  })

  it("acepta payment_intent como objeto Stripe y extrae el id", async () => {
    mockSessionCreate.mockResolvedValue({
      ...mockSession,
      payment_intent: { id: "pi_object_789" },
    } as never)

    await paymentService.createCheckoutSession(appointmentId)

    expect(mockCreatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ stripePaymentIntentId: "pi_object_789" })
    )
  })
})
