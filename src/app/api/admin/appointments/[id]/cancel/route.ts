import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const NON_CANCELLABLE = ["CANCELLED", "COMPLETED", "NO_SHOW"] as const

function daysUntil(date: Date): number {
  const now = new Date()
  return (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (session) => {
    const { id } = await params

    const appointment = await prisma.appointment.findFirst({
      where: { id, deletedAt: null },
    })

    if (!appointment) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Cita no encontrada" } },
        { status: 404 }
      )
    }

    if (NON_CANCELLABLE.includes(appointment.status as (typeof NON_CANCELLABLE)[number])) {
      return Response.json(
        {
          success: false,
          error: {
            code: "ALREADY_CANCELLED",
            message: "La cita no puede cancelarse en su estado actual",
          },
        },
        { status: 409 }
      )
    }

    const refundEligible = daysUntil(appointment.startsAt) >= 4

    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    await prisma.auditLog.create({
      data: {
        action: "APPOINTMENT_CANCELLED",
        entityId: id,
        entityType: "Appointment",
        adminUserId: session.user.id,
        metadata: { refundEligible },
      },
    })

    return Response.json({
      success: true,
      data: { appointment: { id, status: "CANCELLED" }, refundEligible },
    })
  })
}
