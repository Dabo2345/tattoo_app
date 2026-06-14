import { prisma } from "@/lib/db/prisma"
import type { OccupiedPeriod, CalendarConfig, BreakTime } from "../types"

const STUDIO_CONFIG_ID = "00000000-0000-0000-0000-000000000003"

const DEFAULT_CONFIG: CalendarConfig = {
  workingStartHour: 10,
  workingStartMinute: 0,
  workingEndHour: 20,
  workingEndMinute: 0,
  slotDurationMinutes: 30,
  consultationDurationMinutes: 60,
  breaks: [],
}

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

  /**
   * Carga la configuración del estudio desde BD.
   * Si no existe el singleton, devuelve los valores por defecto (RB-009).
   */
  async getStudioConfig(): Promise<CalendarConfig> {
    const config = await prisma.studioConfig.findUnique({
      where: { id: STUDIO_CONFIG_ID },
    })

    if (!config) return DEFAULT_CONFIG

    return {
      workingStartHour: config.workingStartHour,
      workingStartMinute: config.workingStartMinute,
      workingEndHour: config.workingEndHour,
      workingEndMinute: config.workingEndMinute,
      slotDurationMinutes: config.slotDurationMinutes,
      consultationDurationMinutes: config.consultationDurationMinutes,
      breaks: Array.isArray(config.breaks) ? (config.breaks as BreakTime[]) : [],
    }
  },
}
