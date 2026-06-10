import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api/middleware"
import { createApiResponse } from "@/lib/api/response"
import { sessionLinkService } from "@/modules/booking/services/session-link-service"

/**
 * GET /api/session-links/:token
 *
 * Valida el token y devuelve los datos del SessionLink.
 * Errores capturados por withErrorHandler:
 *   - LinkNotFoundError  → 410
 *   - LinkExpiredError   → 410
 *   - LinkAlreadyUsedError → 410
 */
export const GET = withErrorHandler(
  async (
    _req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const { token } = await ctx.params

    const result = await sessionLinkService.validateSessionLink(token)

    return createApiResponse({
      valid: true,
      expiresAt: result.expiresAt,
      durationMinutes: result.sessionDurationMinutes,
    })
  }
)
