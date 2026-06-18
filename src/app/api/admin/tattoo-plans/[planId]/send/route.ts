import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { tattooPlanService } from "@/modules/booking/services/tattoo-plan-service"

export const POST = withAdminAuth(async (_request: NextRequest, ctx): Promise<NextResponse> => {
  const planId = (await ctx.params).planId!
  const result = await tattooPlanService.sendPlanToClient(planId)
  return createApiResponse(result)
})
