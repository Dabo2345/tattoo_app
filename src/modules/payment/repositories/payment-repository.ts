import { prisma } from "@/lib/db/prisma"

export const paymentRepository = {
  /**
   * Crea el registro Payment con status PENDING al iniciar el checkout.
   * Almacena el stripeCheckoutSessionId (siempre disponible al crear la sesión).
   * stripePaymentIntentId es null hasta que Stripe lo confirma por webhook (#018).
   */
  async createPayment(data: {
    appointmentId: string
    stripeCheckoutSessionId: string
    amount: number
  }) {
    return prisma.payment.create({
      data: {
        appointmentId: data.appointmentId,
        stripeCheckoutSessionId: data.stripeCheckoutSessionId,
        amount: data.amount,
        status: "PENDING",
      },
    })
  },

  /**
   * Obtiene el Payment asociado a un appointmentId.
   */
  async findByAppointmentId(appointmentId: string) {
    return prisma.payment.findFirst({
      where: { appointmentId },
    })
  },

  /**
   * Obtiene el Payment por stripePaymentIntentId.
   */
  async findByPaymentIntentId(stripePaymentIntentId: string) {
    return prisma.payment.findFirst({
      where: { stripePaymentIntentId },
    })
  },

  /**
   * Obtiene el Payment por stripeCheckoutSessionId.
   */
  async findByCheckoutSessionId(stripeCheckoutSessionId: string) {
    return prisma.payment.findFirst({
      where: { stripeCheckoutSessionId },
    })
  },

  /**
   * Confirma el pago: transacción atómica Appointment CONFIRMED + Payment PAID.
   * También almacena el stripePaymentIntentId recibido del webhook.
   * Idempotente: solo actualiza si Appointment está en PENDING_PAYMENT.
   * RB-003: no se confirma sin pago válido.
   */
  async confirmPayment(appointmentId: string, stripePaymentIntentId: string) {
    return prisma.$transaction([
      prisma.appointment.updateMany({
        where: { id: appointmentId, status: "PENDING_PAYMENT" },
        data: { status: "CONFIRMED" },
      }),
      prisma.payment.updateMany({
        where: { appointmentId, status: "PENDING" },
        data: { status: "PAID", stripePaymentIntentId },
      }),
    ])
  },

  /**
   * Marca el Payment como REFUNDED cuando Stripe notifica un reembolso.
   */
  async refundPayment(appointmentId: string) {
    return prisma.payment.updateMany({
      where: { appointmentId, status: "PAID" },
      data: { status: "REFUNDED" },
    })
  },
}
