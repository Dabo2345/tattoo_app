import { Prisma } from "@prisma/client"
import { DomainError, InternalError } from "@/lib/api/errors"
import { logger } from "@/lib/logger"

export function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): DomainError {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      return new DomainError("CONFLICT", "El recurso ya existe", 409)
    case "P2025":
      // Record not found
      return new DomainError("NOT_FOUND", "Recurso no encontrado", 404)
    default:
      logger.error({ error, code: error.code }, "Unhandled Prisma error")
      return new InternalError("Error de base de datos")
  }
}
