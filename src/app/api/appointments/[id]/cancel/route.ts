import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withErrorHandler } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { AppointmentNotFoundError, LinkExpiredError } from "@/lib/api/errors"
import { hashToken } from "@/lib/utils/tokens"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { depositPolicyService } from "@/modules/payment/services/deposit-policy"
import { auditService } from "@/modules/audit/services/audit-service"

const bodySchema = z.object({
  magicLinkToken: z.string().min(1, "magicLinkToken es obligatorio"),
})

/**
 * POST /api/appointments/:id/cancel
 *
 * Cancela una cita autenticada con magic link token.
 * Aplica DepositPolicy: ≥4 días → reembolso, <4 días → retención (RB-013/014).
 */
export const POST = withErrorHandler(
  async (
    request: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const { id: appointmentId } = await ctx.params
    const body = await request.json()
    const { magicLinkToken } = bodySchema.parse(body)

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

    // Verificar que el Appointment existe y es cancelable
    const appointment = await bookingRepository.findAppointmentById(appointmentId)

    if (!appointment) {
      throw new AppointmentNotFoundError()
    }

    // Si ya está cancelado, responder idempotente
    if (appointment.status === "CANCELLED") {
      return createApiResponse({ cancelled: true, refunded: false, refundAmount: 0 })
    }

    // Aplicar política de depósito (RB-013/014)
    const policyResult = await depositPolicyService.handleCancellation(
      appointmentId,
      appointment.startsAt
    )

    // Cancelar el appointment
    await bookingRepository.cancelAppointment(appointmentId)

    await auditService.log("APPOINTMENT_CANCELLED", appointmentId, {
      entityType: "Appointment",
      clientId: appointment.clientId,
      metadata: {
        refunded: policyResult.refunded,
        ...(policyResult.refunded ? { stripeRefundId: policyResult.stripeRefundId } : {}),
      },
    })

    return createApiResponse(
      {
        cancelled: true,
        refunded: policyResult.refunded,
        refundAmount: policyResult.refunded ? Number(appointment.depositAmount ?? 50) : 0,
      },
      200
    )
  }
)
