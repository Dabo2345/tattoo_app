import { describe, it, expect, vi, beforeEach } from "vitest"
import { RefundFailedError, PaymentFailedError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    refunds: {
      create: vi.fn(),
    },
  },
}))

vi.mock("@/modules/payment/repositories/payment-repository", () => ({
  paymentRepository: {
    findByAppointmentId: vi.fn(),
    createRefundRecord: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
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
import {
  depositPolicyService,
  daysUntilAppointment,
} from "@/modules/payment/services/deposit-policy"

const mockStripeRefundCreate = vi.mocked(stripe.refunds.create)
const mockFindByAppointmentId = vi.mocked(paymentRepository.findByAppointmentId)
const mockCreateRefundRecord = vi.mocked(paymentRepository.createRefundRecord)
const mockAuditLog = vi.mocked(auditService.log)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const appointmentId = "appt-001"
const mockPayment = {
  id: "pay-001",
  appointmentId,
  stripePaymentIntentId: "pi_test_123",
  amount: 50,
  status: "PAID",
}

function startsAtDaysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(d.getHours() + 1) // evitar milisegundos al límite
  return d
}

// ─── Helper puro ──────────────────────────────────────────────────────────────

describe("daysUntilAppointment", () => {
  it("devuelve 4 para una cita exactamente en 4 días", () => {
    const now = new Date("2026-06-10T10:00:00Z")
    const startsAt = new Date("2026-06-14T10:00:00Z")
    expect(daysUntilAppointment(startsAt, now)).toBe(4)
  })

  it("devuelve 0 para una cita hoy", () => {
    const now = new Date("2026-06-10T10:00:00Z")
    const startsAt = new Date("2026-06-10T12:00:00Z")
    expect(daysUntilAppointment(startsAt, now)).toBe(0)
  })

  it("devuelve 3 para una cita en 3 días y medio", () => {
    const now = new Date("2026-06-10T10:00:00Z")
    const startsAt = new Date("2026-06-13T22:00:00Z")
    expect(daysUntilAppointment(startsAt, now)).toBe(3)
  })
})

// ─── depositPolicyService ─────────────────────────────────────────────────────

describe("depositPolicyService.handleCancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindByAppointmentId.mockResolvedValue(mockPayment as never)
    mockCreateRefundRecord.mockResolvedValue([{}, {}] as never)
    mockAuditLog.mockResolvedValue(undefined)
    mockStripeRefundCreate.mockResolvedValue({ id: "re_test_123" } as never)
  })

  it("con ≥4 días → reembolsa en Stripe y devuelve refunded: true", async () => {
    const startsAt = startsAtDaysFromNow(5)

    const result = await depositPolicyService.handleCancellation(appointmentId, startsAt)

    expect(result).toEqual({ refunded: true, stripeRefundId: "re_test_123" })
    expect(mockStripeRefundCreate).toHaveBeenCalledWith({
      payment_intent: mockPayment.stripePaymentIntentId,
    })
    expect(mockCreateRefundRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: mockPayment.id,
        stripeRefundId: "re_test_123",
        amount: 50,
      })
    )
  })

  it("con <4 días → retiene depósito y devuelve refunded: false", async () => {
    const startsAt = startsAtDaysFromNow(2)

    const result = await depositPolicyService.handleCancellation(appointmentId, startsAt)

    expect(result).toEqual({ refunded: false, reason: "too_late" })
    expect(mockStripeRefundCreate).not.toHaveBeenCalled()
    expect(mockCreateRefundRecord).not.toHaveBeenCalled()
  })

  it("con exactamente 4 días → reembolsa (límite inclusivo RB-013)", async () => {
    const now = new Date()
    const startsAt = new Date(now)
    startsAt.setDate(startsAt.getDate() + 4)
    startsAt.setHours(startsAt.getHours() + 2)

    const result = await depositPolicyService.handleCancellation(appointmentId, startsAt)

    expect(result).toEqual({ refunded: true, stripeRefundId: "re_test_123" })
    expect(mockStripeRefundCreate).toHaveBeenCalled()
  })

  it("mismo día (0 días) → retiene depósito", async () => {
    const startsAt = startsAtDaysFromNow(0)

    const result = await depositPolicyService.handleCancellation(appointmentId, startsAt)

    expect(result).toEqual({ refunded: false, reason: "too_late" })
    expect(mockStripeRefundCreate).not.toHaveBeenCalled()
  })

  it("Stripe falla → lanza RefundFailedError", async () => {
    const startsAt = startsAtDaysFromNow(10)
    mockStripeRefundCreate.mockRejectedValue(new Error("Stripe network error"))

    await expect(depositPolicyService.handleCancellation(appointmentId, startsAt)).rejects.toThrow(
      RefundFailedError
    )

    expect(mockCreateRefundRecord).not.toHaveBeenCalled()
  })

  it("pago sin stripePaymentIntentId → lanza PaymentFailedError", async () => {
    const startsAt = startsAtDaysFromNow(10)
    mockFindByAppointmentId.mockResolvedValue({
      ...mockPayment,
      stripePaymentIntentId: null,
    } as never)

    await expect(depositPolicyService.handleCancellation(appointmentId, startsAt)).rejects.toThrow(
      PaymentFailedError
    )
  })

  it("crea AuditLog DEPOSIT_REFUNDED al reembolsar", async () => {
    const startsAt = startsAtDaysFromNow(7)

    await depositPolicyService.handleCancellation(appointmentId, startsAt)

    expect(mockAuditLog).toHaveBeenCalledWith(
      "DEPOSIT_REFUNDED",
      appointmentId,
      expect.objectContaining({ entityType: "Appointment" })
    )
  })

  it("crea AuditLog DEPOSIT_RETAINED al retener", async () => {
    const startsAt = startsAtDaysFromNow(1)

    await depositPolicyService.handleCancellation(appointmentId, startsAt)

    expect(mockAuditLog).toHaveBeenCalledWith(
      "DEPOSIT_RETAINED",
      appointmentId,
      expect.objectContaining({ entityType: "Appointment" })
    )
  })

  it("no hay Payment en DB → lanza PaymentFailedError", async () => {
    const startsAt = startsAtDaysFromNow(7)
    mockFindByAppointmentId.mockResolvedValue(null)

    await expect(depositPolicyService.handleCancellation(appointmentId, startsAt)).rejects.toThrow(
      PaymentFailedError
    )
    expect(mockStripeRefundCreate).not.toHaveBeenCalled()
  })

  it("reprogramación con <4 días equivale a cancelación tardía — retiene depósito (RB-015)", async () => {
    // RB-015: rescheduling <4 días usa la misma lógica que cancelación tardía
    const startsAt = startsAtDaysFromNow(3)

    const result = await depositPolicyService.handleCancellation(appointmentId, startsAt)

    expect(result).toEqual({ refunded: false, reason: "too_late" })
    expect(mockStripeRefundCreate).not.toHaveBeenCalled()
  })
})
