import { calendarService } from "@/modules/calendar/services/calendar-service"
import { clientRepository } from "../repositories/client-repository"
import { bookingRepository } from "../repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { hashToken } from "@/lib/utils/tokens"
import { LinkAlreadyUsedError, LinkExpiredError, LinkNotFoundError } from "@/lib/api/errors"
import type { BookSessionResult, CreateConsultationInput, CreateConsultationResult } from "../types"

export const bookingService = {
  /**
   * Crea una Consultation siguiendo el flujo:
   * 1. Verificar disponibilidad del slot (RB-012)
   * 2. Crear o recuperar el Client por email (RB-001)
   * 3. Crear Appointment en PENDING_PAYMENT (RB-002, RB-003)
   * 4. Registrar en AuditLog (RB-020)
   *
   * Lanza SlotNotAvailableError si el slot ya no está libre.
   */
  async createConsultation(input: CreateConsultationInput): Promise<CreateConsultationResult> {
    // 1. Verificar slot disponible — lanza SlotNotAvailableError si no
    await calendarService.assertSlotAvailable(input.startsAt, input.endsAt)

    // 2. Crear o recuperar el cliente por email
    const client = await clientRepository.findOrCreate({
      name: input.name,
      email: input.email,
      phone: input.phone,
    })

    // 3. Crear Appointment en PENDING_PAYMENT
    const appointment = await bookingRepository.createConsultation({
      clientId: client.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.tattooDescription,
    })

    // 4. Registrar en AuditLog (RB-020)
    await auditService.log("CONSULTATION_CREATED", appointment.id, {
      entityType: "Appointment",
      clientId: client.id,
      metadata: {
        startsAt: input.startsAt.toISOString(),
        endsAt: input.endsAt.toISOString(),
      },
    })

    return {
      appointmentId: appointment.id,
      clientId: client.id,
    }
  },

  /**
   * Reserva una TattooSession usando un SessionLink.
   * RB-004: sin pago online → status CONFIRMED al crear.
   * RB-005: SessionLink de un solo uso → marca usedAt al finalizar.
   * RB-012: verifica disponibilidad del slot antes de crear.
   */
  async bookTattooSession(token: string, startsAt: Date): Promise<BookSessionResult> {
    const tokenHash = hashToken(token)

    // 1. Buscar SessionLink con Appointment original (para clientId y duración)
    const sessionLink = await bookingRepository.findSessionLinkWithAppointment(tokenHash)
    if (!sessionLink) {
      throw new LinkNotFoundError()
    }
    if (sessionLink.expiresAt < new Date()) {
      throw new LinkExpiredError()
    }
    if (sessionLink.usedAt !== null) {
      throw new LinkAlreadyUsedError()
    }

    // 2. Calcular endsAt según la duración configurada en el SessionLink
    const endsAt = new Date(startsAt.getTime() + sessionLink.sessionDurationMinutes * 60 * 1000)

    // 3. Verificar disponibilidad del slot (RB-012)
    await calendarService.assertSlotAvailable(startsAt, endsAt)

    // 4. Crear Appointment TATTOO_SESSION en CONFIRMED (RB-004: sin pago)
    const appointment = await bookingRepository.createTattooSession({
      clientId: sessionLink.appointment.clientId,
      startsAt,
      endsAt,
    })

    // 5. Marcar SessionLink como usado (RB-005: un solo uso)
    await bookingRepository.markSessionLinkAsUsed(sessionLink.id)

    // 6. Registrar en AuditLog
    await auditService.log("TATTOO_SESSION_BOOKED", appointment.id, {
      entityType: "Appointment",
      clientId: sessionLink.appointment.clientId,
      metadata: {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        sessionLinkId: sessionLink.id,
      },
    })

    return { appointmentId: appointment.id }
  },
}
