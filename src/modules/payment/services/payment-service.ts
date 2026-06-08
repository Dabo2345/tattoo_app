import { stripe } from "@/lib/stripe/client"
import { paymentRepository } from "../repositories/payment-repository"
import { PaymentFailedError } from "@/lib/api/errors"
import { env } from "@/lib/env"
import type { CreateCheckoutSessionResult } from "../types"

// Importe del depósito en EUR. Configurable dinámicamente en issue #045.
const DEPOSIT_AMOUNT_EUR = 50
const DEPOSIT_AMOUNT_CENTS = DEPOSIT_AMOUNT_EUR * 100

export const paymentService = {
  /**
   * Crea una Stripe Checkout Session para el depósito de una consulta.
   * Guarda el Payment en DB con status PENDING.
   * RB-002: toda consulta requiere depósito previo.
   */
  async createCheckoutSession(appointmentId: string): Promise<CreateCheckoutSessionResult> {
    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>

    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: "Depósito consulta de tatuaje" },
              unit_amount: DEPOSIT_AMOUNT_CENTS,
            },
            quantity: 1,
          },
        ],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/reservar/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/reservar?cancelled=true`,
        metadata: { appointmentId },
      })
    } catch {
      throw new PaymentFailedError("No se pudo crear la sesión de pago con Stripe")
    }

    if (!session.url) {
      throw new PaymentFailedError("Stripe no devolvió una URL de checkout")
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id

    if (!paymentIntentId) {
      throw new PaymentFailedError("Stripe no devolvió un Payment Intent")
    }

    await paymentRepository.createPayment({
      appointmentId,
      stripePaymentIntentId: paymentIntentId,
      amount: DEPOSIT_AMOUNT_EUR,
    })

    return { checkoutUrl: session.url }
  },
}
