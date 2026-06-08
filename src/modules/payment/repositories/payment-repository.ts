import { prisma } from "@/lib/db/prisma"

export const paymentRepository = {
  /**
   * Crea el registro Payment con status PENDING al iniciar el checkout.
   * Se confirma a PAID en el webhook de Stripe (#018).
   */
  async createPayment(data: {
    appointmentId: string
    stripePaymentIntentId: string
    amount: number
  }) {
    return prisma.payment.create({
      data: {
        appointmentId: data.appointmentId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        amount: data.amount,
        status: "PENDING",
      },
    })
  },
}
