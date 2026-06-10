import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export type AuditLogInput = {
  action: string
  entityId?: string
  entityType?: string
  adminUserId?: string
  clientId?: string
  metadata?: Prisma.InputJsonValue
}

export const auditRepository = {
  /**
   * Escribe una entrada en AuditLog. RB-020.
   */
  async create(data: AuditLogInput) {
    return prisma.auditLog.create({ data })
  },
}
