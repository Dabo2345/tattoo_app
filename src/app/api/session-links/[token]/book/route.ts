import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withErrorHandler } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { bookingService } from "@/modules/booking/services/booking-service"

const bodySchema = z.object({
  startAt: z.string().datetime({ message: "startAt debe ser una fecha ISO 8601 UTC válida" }),
})

/**
 * POST /api/session-links/:token/book
 *
 * Reserva una TattooSession usando el SessionLink.
 * RB-004: sin pago online, crea Appointment TATTOO_SESSION en CONFIRMED.
 * RB-005: marca el SessionLink como usado (un solo uso).
 * RB-012: verifica disponibilidad del slot antes de crear.
 */
export const POST = withErrorHandler(
  async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const params = await ctx.params
    const token = params.token!
    const body = await req.json()
    const { startAt } = bodySchema.parse(body)

    const result = await bookingService.bookTattooSession(token, new Date(startAt))

    return createApiResponse(result, 201)
  }
)
