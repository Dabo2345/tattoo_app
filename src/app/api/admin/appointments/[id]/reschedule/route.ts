import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAdminAuth } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { AppointmentNotFoundError } from "@/lib/api/errors"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { calendarService } from "@/modules/calendar/services/calendar-service"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const bodySchema = z.object({
  newStartAt: z.string().datetime({ message: "newStartAt debe ser una fecha ISO válida" }),
})

export const POST = withAdminAuth(
  async (request: NextRequest, ctx, session): Promise<NextResponse> => {
    const id = (await ctx.params).id!
    const body = await request.json()
    const { newStartAt } = bodySchema.parse(body)

    const appointment = await bookingRepository.findAppointmentById(id)
    if (!appointment) throw new AppointmentNotFoundError()

    const durationMs = appointment.endsAt.getTime() - appointment.startsAt.getTime()
    const newStartDate = new Date(newStartAt)
    const newEndsAt = new Date(newStartDate.getTime() + durationMs)

    // Validar disponibilidad del slot (appointments, BlockedPeriods, breaks, working hours)
    // Excluir la propia cita para permitir reprogramaciones con solapamiento parcial de horario
    await calendarService.assertSlotAvailable(newStartDate, newEndsAt, id)

    await bookingRepository.rescheduleAppointment(id, newStartDate, newEndsAt)

    await auditService.log("APPOINTMENT_RESCHEDULED", id, {
      entityType: "Appointment",
      adminUserId: session.user.id,
      metadata: {
        oldStartAt: appointment.startsAt.toISOString(),
        newStartAt,
      },
    })

    await notificationService.sendAppointmentRescheduled(id, appointment.startsAt)

    return createApiResponse({
      appointment: {
        id,
        startsAt: newStartDate.toISOString(),
        endsAt: newEndsAt.toISOString(),
      },
    })
  }
)
