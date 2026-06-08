import { stripe } from "@/lib/stripe/client"
import { paymentRepository } from "../repositories/payment-repository"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { RefundFailedError, PaymentFailedError } from "@/lib/api/errors"
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/sentry"

// Días mínimos para que proceda el reembolso automático (RB-013, RB-014)
const REFUND_THRESHOLD_DAYS = 4

export type DepositPolicyResult =
  | { refunded: true; stripeRefundId: string }
  | { refunded: false; reason: "too_late" }

/**
 * Calcula los días completos entre ahora y la fecha de inicio de la cita.
 * Se usa la diferencia en días completos (floor), no fracciones.
 */
export function daysUntilAppointment(startsAt: Date, now = new Date()): number {
  const diffMs = startsAt.getTime() - now.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export const depositPolicyService = {
  /**
   * Evalúa la política de cancelación y ejecuta el reembolso si procede.
   *
   * RB-013: cancelación con ≥4 días → reembolso automático vía Stripe
   * RB-014: cancelación con <4 días → retención del depósito
   * RB-015: reprogramar con <4 días equivale a cancelar (misma lógica)
   */
  async handleCancellation(appointmentId: string, startsAt: Date): Promise<DepositPolicyResult> {
    const days = daysUntilAppointment(startsAt)

    if (days < REFUND_THRESHOLD_DAYS) {
      // RB-014: retención del depósito
      await bookingRepository.createAuditLog({
        action: "DEPOSIT_RETAINED",
        entityId: appointmentId,
        entityType: "Appointment",
        metadata: { daysUntilAppointment: days, reason: "cancelled_too_late" },
      })

      logger.info({ appointmentId, days }, "Depósito retenido por cancelación tardía (RB-014)")

      return { refunded: false, reason: "too_late" }
    }

    // RB-013: reembolso automático
    const payment = await paymentRepository.findByAppointmentId(appointmentId)

    if (!payment) {
      throw new PaymentFailedError("No se encontró el pago asociado a esta cita")
    }

    if (!payment.stripePaymentIntentId) {
      throw new PaymentFailedError("El pago no tiene un Payment Intent de Stripe asociado")
    }

    let stripeRefundId: string

    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
      })
      stripeRefundId = refund.id
    } catch (err) {
      logger.error({ err, appointmentId }, "Error al crear reembolso en Stripe")
      captureException(err)
      throw new RefundFailedError()
    }

    await paymentRepository.createRefundRecord({
      paymentId: payment.id,
      appointmentId,
      stripeRefundId,
      amount: Number(payment.amount),
    })

    await bookingRepository.createAuditLog({
      action: "DEPOSIT_REFUNDED",
      entityId: appointmentId,
      entityType: "Appointment",
      metadata: { stripeRefundId, daysUntilAppointment: days },
    })

    logger.info({ appointmentId, stripeRefundId, days }, "Depósito reembolsado (RB-013)")

    return { refunded: true, stripeRefundId }
  },
}
