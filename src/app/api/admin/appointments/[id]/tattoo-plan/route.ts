import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { tattooPlanService } from "@/modules/booking/services/tattoo-plan-service"
import { createTattooPlanSchema } from "@/modules/booking/schemas/tattoo-plan-schema"

export const GET = withAdminAuth(async (_request: NextRequest, ctx): Promise<NextResponse> => {
  const id = (await ctx.params).id!
  const plan = await tattooPlanService.getPlanByAppointmentId(id)
  return createApiResponse(plan)
})

export const POST = withAdminAuth(async (request: NextRequest, ctx): Promise<NextResponse> => {
  const id = (await ctx.params).id!
  const body = await request.json()
  const parsed = createTattooPlanSchema.parse(body)
  const plan = await tattooPlanService.createPlan(id, parsed)
  return createApiResponse(plan, 201)
})
