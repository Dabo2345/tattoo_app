import { prisma } from "@/lib/db/prisma"
import type { OccupiedPeriod } from "../types"

export const calendarRepository = {
  /**
   * Citas activas (PENDING_PAYMENT o CONFIRMED) que se solapan con el rango.
   * CANCELLED, COMPLETED y NO_SHOW no bloquean disponibilidad.
   */
  async getActiveAppointmentsInRange(from: Date, to: Date): Promise<OccupiedPeriod[]> {
    return prisma.appointment.findMany({
      where: {
        deletedAt: null,
        status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: { startsAt: true, endsAt: true },
    })
  },

  /**
   * Periodos bloqueados que se solapan con el rango.
   * RB-011: prioridad absoluta sobre cualquier disponibilidad.
   */
  async getBlockedPeriodsInRange(from: Date, to: Date): Promise<OccupiedPeriod[]> {
    return prisma.blockedPeriod.findMany({
      where: {
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: { startsAt: true, endsAt: true },
    })
  },
}
