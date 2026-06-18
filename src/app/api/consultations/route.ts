import { NextRequest, NextResponse } from "next/server"
import { bookingService } from "@/modules/booking/services/booking-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import { createConsultationSchema } from "@/modules/booking/schemas/create-consultation.schema"
import { createApiResponse } from "@/lib/api/response"
import { withErrorHandler } from "@/lib/api/middleware"

export const POST = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  const body = await request.json()
  const parsed = createConsultationSchema.parse(body)

  const { appointmentId } = await bookingService.createConsultation(parsed)

  // RB-NEW-002: email de confirmación se envía inmediatamente tras crear la consulta
  await notificationService.sendConsultationConfirmed(appointmentId)

  return createApiResponse({ appointmentId, status: "CONFIRMED" }, 201)
})
