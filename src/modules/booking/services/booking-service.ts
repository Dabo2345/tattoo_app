import { calendarService } from "@/modules/calendar/services/calendar-service"
import { clientRepository } from "../repositories/client-repository"
import { bookingRepository } from "../repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import type { CreateConsultationInput, CreateConsultationResult } from "../types"

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
}
