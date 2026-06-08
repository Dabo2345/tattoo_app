import { PaymentFailedError } from "@/lib/api/errors"
import type { CreateCheckoutSessionResult } from "../types"

export const paymentService = {
  /**
   * Crea una Stripe Checkout Session para el depósito de consulta.
   * Implementación completa en issue #017.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCheckoutSession(_appointmentId: string): Promise<CreateCheckoutSessionResult> {
    throw new PaymentFailedError("Stripe no está configurado aún (#017)")
  },
}
