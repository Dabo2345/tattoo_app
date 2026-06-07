import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import { auth, type Session } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/sentry"
import { createApiError } from "./response"
import { DomainError, UnauthorizedError } from "./errors"
import { handlePrismaError } from "@/lib/db/prisma-errors"

type RouteContext = { params: Promise<Record<string, string>> }
type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>
type AuthenticatedRouteHandler = (
  req: NextRequest,
  ctx: RouteContext,
  session: Session
) => Promise<NextResponse>

/**
 * Captura todos los errores del handler y los convierte al formato API-001.
 * Nunca expone detalles internos al cliente.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      return handleError(error)
    }
  }
}

/**
 * Verifica sesión de admin antes de ejecutar el handler.
 * Compone withErrorHandler — los errores de auth también se capturan.
 */
export function withAdminAuth(handler: AuthenticatedRouteHandler): RouteHandler {
  return withErrorHandler(async (req, ctx) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new UnauthorizedError()
    }
    return handler(req, ctx, session)
  })
}

function handleError(error: unknown): NextResponse {
  // Error de validación Zod
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0]
    return createApiError(
      "VALIDATION_ERROR",
      firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Datos inválidos",
      400
    )
  }

  // Error de dominio conocido (negocio)
  if (error instanceof DomainError) {
    if (error.statusCode >= 500) {
      logger.error({ error }, `Domain error: ${error.code}`)
      captureException(error)
    } else {
      logger.warn({ code: error.code }, `Business error: ${error.message}`)
    }
    return createApiError(error.code, error.message, error.statusCode)
  }

  // Error de Prisma → mapear a error de dominio
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const domainError = handlePrismaError(error)
    return createApiError(domainError.code, domainError.message, domainError.statusCode)
  }

  // Error inesperado → reportar a Sentry, respuesta genérica al cliente
  logger.error({ error }, "Unhandled error in route handler")
  captureException(error)
  return createApiError("INTERNAL_ERROR", "Error interno del servidor", 500)
}
