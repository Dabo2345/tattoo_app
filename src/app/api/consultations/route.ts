import { NextRequest, NextResponse } from "next/server"
import { bookingService } from "@/modules/booking/services/booking-service"
import { paymentService } from "@/modules/payment/services/payment-service"
import { createConsultationSchema } from "@/modules/booking/schemas/create-consultation.schema"
import { createApiResponse } from "@/lib/api/response"
import { withErrorHandler } from "@/lib/api/middleware"

export const POST = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  const body = await request.json()
  const parsed = createConsultationSchema.parse(body)

  const { appointmentId } = await bookingService.createConsultation(parsed)

  const { checkoutUrl } = await paymentService.createCheckoutSession(appointmentId)

  return createApiResponse({ appointmentId, stripeCheckoutUrl: checkoutUrl }, 201)
})
