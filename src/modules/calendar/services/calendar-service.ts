import { calendarRepository } from "../repositories/calendar-repository"
import { SlotNotAvailableError } from "@/lib/api/errors"
import type { TimeSlot, OccupiedPeriod, CalendarConfig, BreakTime } from "../types"

// ─── Defaults (RB-009) ────────────────────────────────────────────────────────

const MAX_DAYS_AHEAD = 60 // RB-008

export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  workingStartHour: 10,
  workingStartMinute: 0,
  workingEndHour: 20,
  workingEndMinute: 0,
  slotDurationMinutes: 30,
  consultationDurationMinutes: 60,
  breaks: [],
}

// ─── Helpers puros (sin I/O, testables de forma aislada) ─────────────────────

/**
 * Comprueba si dos periodos de tiempo se solapan.
 * Condición de solapamiento: A.start < B.end AND A.end > B.start
 */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart
}

/**
 * Comprueba si un slot está dentro del horario laboral del día.
 * El slot completo (start + duration) debe caber dentro del horario configurado.
 */
export function isWithinWorkingHours(
  startAt: Date,
  endAt: Date,
  config: CalendarConfig = DEFAULT_CALENDAR_CONFIG
): boolean {
  const startMinutes = startAt.getUTCHours() * 60 + startAt.getUTCMinutes()
  const endMinutes = endAt.getUTCHours() * 60 + endAt.getUTCMinutes()
  const workStart = config.workingStartHour * 60 + config.workingStartMinute
  const workEnd = config.workingEndHour * 60 + config.workingEndMinute
  return startMinutes >= workStart && endMinutes <= workEnd
}

/**
 * Comprueba si un periodo se solapa con alguno de los periodos ocupados.
 */
export function isOccupied(startAt: Date, endAt: Date, occupied: OccupiedPeriod[]): boolean {
  return occupied.some((period) => overlaps(startAt, endAt, period.startsAt, period.endsAt))
}

/**
 * Genera todos los posibles slots para un día concreto según la configuración.
 * El último slot válido debe terminar exactamente en workingEndHour:workingEndMinute.
 */
export function generateDaySlots(
  date: Date,
  config: CalendarConfig = DEFAULT_CALENDAR_CONFIG
): Array<{ startsAt: Date; endsAt: Date }> {
  const slots = []
  const workStart = config.workingStartHour * 60 + config.workingStartMinute
  const workEnd = config.workingEndHour * 60 + config.workingEndMinute
  const lastStart = workEnd - config.consultationDurationMinutes

  for (let minutes = workStart; minutes <= lastStart; minutes += config.slotDurationMinutes) {
    const startsAt = new Date(date)
    startsAt.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

    const endsAt = new Date(startsAt)
    endsAt.setUTCMinutes(endsAt.getUTCMinutes() + config.consultationDurationMinutes)

    slots.push({ startsAt, endsAt })
  }

  return slots
}

/**
 * Convierte los breaks de la config en OccupiedPeriods para un día concreto.
 * RB-010: los breaks bloquean automáticamente esos slots.
 */
export function breaksToOccupiedPeriods(date: Date, breaks: BreakTime[]): OccupiedPeriod[] {
  return breaks.map((b) => {
    const startsAt = new Date(date)
    startsAt.setUTCHours(b.startHour, b.startMinute, 0, 0)

    const endsAt = new Date(date)
    endsAt.setUTCHours(b.endHour, b.endMinute, 0, 0)

    return { startsAt, endsAt }
  })
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const calendarService = {
  /**
   * Devuelve los slots disponibles para Consultation en el rango dado.
   * Aplica RB-008 (máx 60 días), RB-009 (horario configurable), RB-010 (breaks),
   * RB-011 (BlockedPeriods), RB-012 (sin solapamientos).
   */
  async getAvailableSlots(from: Date, to: Date): Promise<TimeSlot[]> {
    const now = new Date()
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD)

    // Limitar al rango permitido (RB-008)
    const rangeStart = from < now ? now : from
    const rangeEnd = to > maxDate ? maxDate : to

    if (rangeStart >= rangeEnd) return []

    // Cargar config + ocupaciones en paralelo
    const [config, appointments, blockedPeriods] = await Promise.all([
      calendarRepository.getStudioConfig(),
      calendarRepository.getActiveAppointmentsInRange(rangeStart, rangeEnd),
      calendarRepository.getBlockedPeriodsInRange(rangeStart, rangeEnd),
    ])

    const occupied = [...appointments, ...blockedPeriods]
    const available: TimeSlot[] = []

    // Iterar día a día en el rango
    const cursor = new Date(rangeStart)
    cursor.setUTCHours(0, 0, 0, 0)

    while (cursor <= rangeEnd) {
      const daySlots = generateDaySlots(cursor, config)
      const breakPeriods = breaksToOccupiedPeriods(cursor, config.breaks)
      const allOccupied = [...occupied, ...breakPeriods]

      for (const slot of daySlots) {
        // Descartar slots ya pasados
        if (slot.startsAt <= now) continue
        // Descartar slots fuera del rango solicitado
        if (slot.startsAt < rangeStart || slot.endsAt > rangeEnd) continue
        // Descartar slots ocupados o en break
        if (isOccupied(slot.startsAt, slot.endsAt, allOccupied)) continue

        available.push({ startsAt: slot.startsAt, endsAt: slot.endsAt })
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    return available
  },

  /**
   * Verifica si un slot concreto está disponible para crear una Consultation.
   * Lanza SlotNotAvailableError si no está libre.
   * Usado por BookingService (#015) antes de crear una cita.
   */
  async assertSlotAvailable(startAt: Date, endAt: Date): Promise<void> {
    const [config, appointments, blockedPeriods] = await Promise.all([
      calendarRepository.getStudioConfig(),
      calendarRepository.getActiveAppointmentsInRange(startAt, endAt),
      calendarRepository.getBlockedPeriodsInRange(startAt, endAt),
    ])

    if (!isWithinWorkingHours(startAt, endAt, config)) {
      throw new SlotNotAvailableError()
    }

    const dayBreaks = breaksToOccupiedPeriods(startAt, config.breaks)

    if (
      appointments.length > 0 ||
      blockedPeriods.length > 0 ||
      isOccupied(startAt, endAt, dayBreaks)
    ) {
      throw new SlotNotAvailableError()
    }
  },
}
