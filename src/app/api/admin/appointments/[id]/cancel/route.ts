import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { createApiResponse } from "@/lib/api/response"
import { notificationService } from "@/modules/notification/services/notification-service"
import { depositPolicyService } from "@/modules/payment/services/deposit-policy"
import { auditService } from "@/modules/audit/services/audit-service"

const NON_CANCELLABLE = ["CANCELLED", "COMPLETED", "NO_SHOW"] as const

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

    // Aplicar política de depósito (RB-013/014): ejecuta reembolso Stripe si ≥4 días
    const policyResult = await depositPolicyService.handleCancellation(id, appointment.startsAt)

    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    await auditService.log("APPOINTMENT_CANCELLED", id, {
      entityType: "Appointment",
      adminUserId: session.user.id,
      metadata: {
        refunded: policyResult.refunded,
        ...(policyResult.refunded
          ? { stripeRefundId: policyResult.stripeRefundId }
          : { reason: policyResult.reason }),
      },
    })

    await notificationService.sendAppointmentCancelled(id)

    return createApiResponse({
      appointment: { id, status: "CANCELLED" },
      refunded: policyResult.refunded,
      ...(policyResult.refunded ? { stripeRefundId: policyResult.stripeRefundId } : {}),
    })
  })
}
