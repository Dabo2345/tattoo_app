import { prisma } from "@/lib/db/prisma"

export const bookingRepository = {
  /**
   * Crea un Appointment de tipo CONSULTATION en estado PENDING_PAYMENT.
   * RB-002: depositRequired=true. RB-003: estado inicial sin pago confirmado.
   * depositAmount queda null hasta que Stripe genera el checkout (#017).
   */
  async createConsultation(data: {
    clientId: string
    startsAt: Date
    endsAt: Date
    notes?: string
  }) {
    return prisma.appointment.create({
      data: {
        clientId: data.clientId,
        type: "CONSULTATION",
        status: "PENDING_PAYMENT",
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        notes: data.notes,
        depositRequired: true,
      },
    })
  },

  /**
   * Obtiene un Appointment por id con el cliente asociado.
   */
  async findAppointmentById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: { client: true },
    })
  },

  /**
   * Cancela un Appointment (CONFIRMED → CANCELLED).
   * Solo cancela si el estado actual es cancelable (no ya CANCELLED/COMPLETED).
   */
  async cancelAppointment(id: string) {
    return prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    })
  },

  /**
   * Reprograma un Appointment actualizando startsAt y endsAt.
   * RB-015: solo permitido si el caller ha validado ≥4 días antes de llamar.
   */
  async rescheduleAppointment(id: string, newStartsAt: Date, newEndsAt: Date) {
    return prisma.appointment.update({
      where: { id },
      data: { startsAt: newStartsAt, endsAt: newEndsAt },
    })
  },

  /**
   * Busca un MagicLink por su tokenHash.
   * Usado para validar el token de gestión del cliente.
   */
  async findMagicLinkByHash(tokenHash: string) {
    return prisma.magicLink.findUnique({
      where: { tokenHash },
    })
  },
}
