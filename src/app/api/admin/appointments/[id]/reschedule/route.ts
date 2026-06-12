import { z } from "zod"
import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { notificationService } from "@/modules/notification/services/notification-service"

const rescheduleBodySchema = z.object({
  newStartAt: z.string().datetime({ message: "newStartAt debe ser una fecha ISO válida" }),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (session) => {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Body inválido" } },
        { status: 400 }
      )
    }

    const parsed = rescheduleBodySchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message } },
        { status: 400 }
      )
    }

    const { newStartAt } = parsed.data

    const appointment = await prisma.appointment.findFirst({
      where: { id, deletedAt: null },
    })

    if (!appointment) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Cita no encontrada" } },
        { status: 404 }
      )
    }

    const durationMs = appointment.endsAt.getTime() - appointment.startsAt.getTime()
    const newStartDate = new Date(newStartAt)
    const newEndsAt = new Date(newStartDate.getTime() + durationMs)

    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        deletedAt: null,
        status: { notIn: ["CANCELLED"] },
        AND: [{ startsAt: { lt: newEndsAt } }, { endsAt: { gt: newStartDate } }],
      },
    })

    if (conflict) {
      return Response.json(
        {
          success: false,
          error: {
            code: "SLOT_NOT_AVAILABLE",
            message: "El nuevo horario está ocupado por otra cita",
          },
        },
        { status: 409 }
      )
    }

    await prisma.appointment.update({
      where: { id },
      data: { startsAt: newStartDate, endsAt: newEndsAt },
    })

    await prisma.auditLog.create({
      data: {
        action: "APPOINTMENT_RESCHEDULED",
        entityId: id,
        entityType: "Appointment",
        adminUserId: session.user.id,
        metadata: {
          oldStartAt: appointment.startsAt.toISOString(),
          newStartAt,
        },
      },
    })

    await notificationService.sendAppointmentRescheduled(id, appointment.startsAt)

    return Response.json({
      success: true,
      data: {
        appointment: {
          id,
          startsAt: newStartDate.toISOString(),
          endsAt: newEndsAt.toISOString(),
        },
      },
    })
  })
}
