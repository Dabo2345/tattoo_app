import { prisma } from "@/lib/db/prisma"
import type { NotificationType } from "@prisma/client"

// ─── NotificationRepository ───────────────────────────────────────────────────

export const notificationRepository = {
  async create(appointmentId: string, type: NotificationType) {
    return prisma.notification.create({
      data: { appointmentId, type },
    })
  },

  async markSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    })
  },

  async markFailed(id: string, errorMessage: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "FAILED", failedAt: new Date(), errorMessage },
    })
  },

  async findByAppointment(appointmentId: string) {
    return prisma.notification.findMany({
      where: { appointmentId },
      orderBy: { createdAt: "desc" },
    })
  },

  async countFailedRecent(sinceMinutes: number) {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000)
    return prisma.notification.count({
      where: { status: "FAILED", failedAt: { gte: since } },
    })
  },
}
