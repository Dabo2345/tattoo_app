import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { magicLinkService } from "@/modules/booking/services/magic-link-service"

/**
 * GET /api/magic-links/:token
 *
 * Valida el token y devuelve los datos de la cita asociada.
 * Errores posibles (capturados por withErrorHandler):
 *   - LinkNotFoundError  → 410 LINK_EXPIRED
 *   - LinkExpiredError   → 410 LINK_EXPIRED
 */
export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const { token } = await ctx.params

    const result = await magicLinkService.validateMagicLink(token)

    return createApiResponse(result)
  }
)
