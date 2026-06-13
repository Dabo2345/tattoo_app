import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withErrorHandler } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import {
  AppointmentNotFoundError,
  LinkExpiredError,
  RescheduleNotAllowedError,
} from "@/lib/api/errors"
import { hashToken } from "@/lib/utils/tokens"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { calendarService } from "@/modules/calendar/services/calendar-service"
import { daysUntilAppointment } from "@/modules/payment/services/deposit-policy"
import { auditService } from "@/modules/audit/services/audit-service"

const CONSULTATION_DURATION_MINUTES = 60

const bodySchema = z.object({
  magicLinkToken: z.string().min(1, "magicLinkToken es obligatorio"),
  newStartAt: z.string().datetime({ message: "newStartAt debe ser una fecha ISO 8601 válida" }),
})

/**
 * POST /api/appointments/:id/reschedule
 *
 * Reprograma una cita autenticada con magic link token.
 * RB-015: reprogramar con <4 días de antelación no está permitido.
 */
export const POST = withErrorHandler(
  async (
    request: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const { id: appointmentId } = await ctx.params
    const body = await request.json()
    const { magicLinkToken, newStartAt: newStartAtRaw } = bodySchema.parse(body)

    // Validar MagicLink: hash SHA-256 → buscar en DB
    const tokenHash = hashToken(magicLinkToken)
    const magicLink = await bookingRepository.findMagicLinkByHash(tokenHash)

    if (!magicLink) {
      throw new LinkExpiredError()
    }

    if (magicLink.expiresAt < new Date()) {
      throw new LinkExpiredError()
    }

    if (magicLink.appointmentId !== appointmentId) {
      throw new LinkExpiredError()
    }

    // Verificar que el Appointment existe y está en estado reprogramable
    const appointment = await bookingRepository.findAppointmentById(appointmentId)

    if (!appointment) {
      throw new AppointmentNotFoundError()
    }

    if (appointment.status !== "CONFIRMED") {
      throw new RescheduleNotAllowedError()
    }

    // RB-015: no se puede reprogramar con <4 días de antelación
    const days = daysUntilAppointment(appointment.startsAt)
    if (days < 4) {
      throw new RescheduleNotAllowedError()
    }

    // Calcular nuevo slot (60 min)
    const newStartAt = new Date(newStartAtRaw)
    const newEndsAt = new Date(newStartAt)
    newEndsAt.setMinutes(newEndsAt.getMinutes() + CONSULTATION_DURATION_MINUTES)

    // Validar disponibilidad del nuevo slot
    await calendarService.assertSlotAvailable(newStartAt, newEndsAt)

    // Reprogramar
    await bookingRepository.rescheduleAppointment(appointmentId, newStartAt, newEndsAt)

    await auditService.log("APPOINTMENT_RESCHEDULED", appointmentId, {
      entityType: "Appointment",
      clientId: appointment.clientId,
      metadata: {
        previousStartsAt: appointment.startsAt.toISOString(),
        newStartsAt: newStartAt.toISOString(),
      },
    })

    return createApiResponse({
      rescheduled: true,
      newStartAt: newStartAt.toISOString(),
      newEndsAt: newEndsAt.toISOString(),
    })
  }
)
