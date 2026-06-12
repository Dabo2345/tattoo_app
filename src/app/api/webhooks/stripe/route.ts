import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/sentry"
import { paymentRepository } from "@/modules/payment/repositories/payment-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import type Stripe from "stripe"

/**
 * POST /api/webhooks/stripe
 *
 * Recibe eventos de Stripe y actualiza el estado del Appointment y Payment.
 * RA-004: Stripe solo desde backend.
 * RB-003: Sin confirmación sin pago válido.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    logger.warn("Stripe webhook recibido sin header stripe-signature")
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    logger.warn({ err }, "Firma inválida en webhook de Stripe")
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        logger.info({ eventType: event.type }, "Evento Stripe desconocido — ignorado")
    }
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Error procesando evento Stripe")
    captureException(err)
    // Devolver 200 para evitar reintentos de Stripe en errores internos
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const appointmentId = session.metadata?.appointmentId

  if (!appointmentId) {
    logger.error(
      { sessionId: session.id },
      "checkout.session.completed sin appointmentId en metadata"
    )
    return
  }

  // Idempotencia: verificar estado antes de modificar
  const existing = await paymentRepository.findByAppointmentId(appointmentId)

  if (existing?.status === "PAID") {
    logger.info({ appointmentId }, "Pago ya confirmado — webhook ignorado (idempotente)")
    return
  }

  // Extraer el payment_intent del evento del webhook (aquí sí está disponible)
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? "")

  await paymentRepository.confirmPayment(appointmentId, paymentIntentId)

  await auditService.log("CONSULTATION_CONFIRMED", appointmentId, {
    entityType: "Appointment",
    metadata: { stripeSessionId: session.id, paymentIntentId },
  })

  logger.info({ appointmentId, sessionId: session.id }, "Consulta confirmada tras pago exitoso")

  await notificationService.sendConsultationConfirmed(appointmentId)
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null)

  if (!paymentIntentId) {
    logger.warn({ chargeId: charge.id }, "charge.refunded sin payment_intent")
    return
  }

  // Buscar el Payment por stripePaymentIntentId (ya poblado tras el pago)
  const payment = await paymentRepository.findByPaymentIntentId(paymentIntentId)

  if (!payment) {
    logger.warn({ paymentIntentId }, "charge.refunded: Payment no encontrado")
    return
  }

  await paymentRepository.refundPayment(payment.appointmentId)

  logger.info(
    { paymentIntentId, appointmentId: payment.appointmentId },
    "Pago marcado como REFUNDED"
  )
}
