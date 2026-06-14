import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { AppointmentNotFoundError, DomainError } from "@/lib/api/errors"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import { daysUntilAppointment } from "@/modules/payment/services/deposit-policy"

const NON_CANCELLABLE = ["CANCELLED", "COMPLETED", "NO_SHOW"] as const

export const POST = withAdminAuth(
  async (_request: NextRequest, ctx, session): Promise<NextResponse> => {
    const id = (await ctx.params).id!

    const appointment = await bookingRepository.findAppointmentById(id)
    if (!appointment) throw new AppointmentNotFoundError()

    if (NON_CANCELLABLE.includes(appointment.status as (typeof NON_CANCELLABLE)[number])) {
      throw new DomainError(
        "ALREADY_CANCELLED",
        "La cita no puede cancelarse en su estado actual",
        409
      )
    }

    const refundEligible = daysUntilAppointment(appointment.startsAt) >= 4

    await bookingRepository.cancelAppointment(id)

    await auditService.log("APPOINTMENT_CANCELLED", id, {
      entityType: "Appointment",
      adminUserId: session.user.id,
      metadata: { refundEligible },
    })

    await notificationService.sendAppointmentCancelled(id)

    return createApiResponse({ appointment: { id, status: "CANCELLED" }, refundEligible })
  }
)
