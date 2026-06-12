import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withErrorHandler } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { magicLinkService } from "@/modules/booking/services/magic-link-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import { clientRepository } from "@/modules/booking/repositories/client-repository"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"

const bodySchema = z.object({
  email: z.string().email("email debe ser una dirección válida"),
})

/**
 * POST /api/magic-links/request
 *
 * Genera un MagicLink para la cita CONFIRMED más reciente del cliente.
 * Siempre devuelve { success: true } aunque el email no exista (seguridad:
 * no revelar si un email está registrado en el sistema).
 * El envío del email queda pendiente de #049 (NotificationService).
 */
export const POST = withErrorHandler(async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json()
  const { email } = bodySchema.parse(body)

  const client = await clientRepository.findByEmail(email)
  if (!client) {
    return createApiResponse({ requested: true })
  }

  const appointment = await bookingRepository.findLatestConfirmedAppointmentByClientId(client.id)
  if (!appointment) {
    return createApiResponse({ requested: true })
  }

  const { token } = await magicLinkService.createMagicLink(appointment.id)

  await notificationService.sendMagicLink(appointment.id, token)

  return createApiResponse({ requested: true })
})
