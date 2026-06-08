import { calendarRepository } from "../repositories/calendar-repository"
import { SlotNotAvailableError } from "@/lib/api/errors"
import type { TimeSlot, OccupiedPeriod } from "../types"

// ─── Constantes (configurables en #045) ──────────────────────────────────────

const WORKING_START_HOUR = 10
const WORKING_END_HOUR = 20
const SLOT_DURATION_MINUTES = 30
const CONSULTATION_DURATION_MINUTES = 60
const MAX_DAYS_AHEAD = 60 // RB-008

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
 * El slot completo (start + duration) debe caber dentro de 10:00–20:00.
 */
export function isWithinWorkingHours(startAt: Date, endAt: Date): boolean {
  const startMinutes = startAt.getUTCHours() * 60 + startAt.getUTCMinutes()
  const endMinutes = endAt.getUTCHours() * 60 + endAt.getUTCMinutes()
  const workStart = WORKING_START_HOUR * 60
  const workEnd = WORKING_END_HOUR * 60
  return startMinutes >= workStart && endMinutes <= workEnd
}

/**
 * Comprueba si un periodo se solapa con alguno de los periodos ocupados.
 */
export function isOccupied(startAt: Date, endAt: Date, occupied: OccupiedPeriod[]): boolean {
  return occupied.some((period) => overlaps(startAt, endAt, period.startsAt, period.endsAt))
}

/**
 * Genera todos los posibles slots de 30 min para un día concreto
 * dentro del horario laboral (10:00–19:30 como inicio del último slot de 60min).
 */
export function generateDaySlots(date: Date): Array<{ startAt: Date; endAt: Date }> {
  const slots = []
  const lastStart = WORKING_END_HOUR * 60 - CONSULTATION_DURATION_MINUTES

  for (
    let minutes = WORKING_START_HOUR * 60;
    minutes <= lastStart;
    minutes += SLOT_DURATION_MINUTES
  ) {
    const startAt = new Date(date)
    startAt.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

    const endAt = new Date(startAt)
    endAt.setUTCMinutes(endAt.getUTCMinutes() + CONSULTATION_DURATION_MINUTES)

    slots.push({ startAt, endAt })
  }

  return slots
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const calendarService = {
  /**
   * Devuelve los slots disponibles para Consultation (60min) en el rango dado.
   * Aplica RB-008 (máx 60 días), RB-009 (horario 10–20), RB-011 (BlockedPeriods),
   * RB-012 (sin solapamientos).
   */
  async getAvailableSlots(from: Date, to: Date): Promise<TimeSlot[]> {
    const now = new Date()
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD)

    // Limitar al rango permitido (RB-008)
    const rangeStart = from < now ? now : from
    const rangeEnd = to > maxDate ? maxDate : to

    if (rangeStart >= rangeEnd) return []

    // Obtener ocupaciones del repositorio
    const [appointments, blockedPeriods] = await Promise.all([
      calendarRepository.getActiveAppointmentsInRange(rangeStart, rangeEnd),
      calendarRepository.getBlockedPeriodsInRange(rangeStart, rangeEnd),
    ])

    const occupied = [...appointments, ...blockedPeriods]
    const available: TimeSlot[] = []

    // Iterar día a día en el rango
    const cursor = new Date(rangeStart)
    cursor.setUTCHours(0, 0, 0, 0)

    while (cursor <= rangeEnd) {
      const daySlots = generateDaySlots(cursor)

      for (const slot of daySlots) {
        // Descartar slots ya pasados
        if (slot.startAt <= now) continue
        // Descartar slots fuera del rango solicitado
        if (slot.startAt < rangeStart || slot.endAt > rangeEnd) continue
        // Descartar slots ocupados
        if (isOccupied(slot.startAt, slot.endAt, occupied)) continue

        available.push({ startAt: slot.startAt, endAt: slot.endAt })
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
    if (!isWithinWorkingHours(startAt, endAt)) {
      throw new SlotNotAvailableError()
    }

    const [appointments, blockedPeriods] = await Promise.all([
      calendarRepository.getActiveAppointmentsInRange(startAt, endAt),
      calendarRepository.getBlockedPeriodsInRange(startAt, endAt),
    ])

    if (appointments.length > 0 || blockedPeriods.length > 0) {
      throw new SlotNotAvailableError()
    }
  },
}
