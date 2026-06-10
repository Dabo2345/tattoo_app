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
   * Guarda el Payment en DB con status PENDING usando el checkout session ID.
   * El stripePaymentIntentId se rellena cuando Stripe confirma el pago (webhook #018).
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

    // session.payment_intent es null al crear la sesión (Stripe lo genera después).
    // Guardamos session.id como clave de rastreo; el payment_intent se almacena
    // al recibir el webhook checkout.session.completed (#018).
    await paymentRepository.createPayment({
      appointmentId,
      stripeCheckoutSessionId: session.id,
      amount: DEPOSIT_AMOUNT_EUR,
    })

    return { checkoutUrl: session.url }
  },
}
