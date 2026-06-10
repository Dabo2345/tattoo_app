import { auditRepository } from "../repositories/audit-repository"
import type { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"

/**
 * Servicio de auditoría. RB-020: toda acción relevante genera un AuditLog.
 * Los errores de escritura se loguean pero nunca se propagan al caller.
 */
export const auditService = {
  async log(
    action: string,
    entityId?: string,
    options?: {
      entityType?: string
      clientId?: string
      adminUserId?: string
      metadata?: Prisma.InputJsonValue
    }
  ): Promise<void> {
    try {
      await auditRepository.create({
        action,
        entityId,
        entityType: options?.entityType,
        clientId: options?.clientId,
        adminUserId: options?.adminUserId,
        metadata: options?.metadata ?? undefined,
      })
    } catch (error) {
      logger.error({ error, action, entityId }, "AuditService: failed to write audit log")
    }
  },
}
