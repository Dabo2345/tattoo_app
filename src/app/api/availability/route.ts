import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { calendarService } from "@/modules/calendar/services/calendar-service"
import { createApiResponse } from "@/lib/api/response"
import { withErrorHandler } from "@/lib/api/middleware"

const querySchema = z.object({
  from: z.string().datetime({ message: "from debe ser una fecha ISO 8601 UTC válida" }),
  to: z.string().datetime({ message: "to debe ser una fecha ISO 8601 UTC válida" }),
  type: z.enum(["consultation"]).optional().default("consultation"),
})

export const GET = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams } = request.nextUrl
  const raw = {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  }

  const parsed = querySchema.parse(raw)
  const from = new Date(parsed.from)
  const to = new Date(parsed.to)

  const slots = await calendarService.getAvailableSlots(from, to)

  return createApiResponse(slots)
})
