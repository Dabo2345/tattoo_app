import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  overlaps,
  isWithinWorkingHours,
  isOccupied,
  generateDaySlots,
  breaksToOccupiedPeriods,
  filterStartSlotsByDuration,
  calendarService,
  DEFAULT_CALENDAR_CONFIG,
} from "@/modules/calendar/services/calendar-service"
import type { CalendarConfig } from "@/modules/calendar/types"

// Mock del repositorio para aislar la lógica de negocio
vi.mock("@/modules/calendar/repositories/calendar-repository", () => ({
  calendarRepository: {
    getActiveAppointmentsInRange: vi.fn().mockResolvedValue([]),
    getBlockedPeriodsInRange: vi.fn().mockResolvedValue([]),
    getStudioConfig: vi.fn().mockResolvedValue({
      workingStartHour: 10,
      workingStartMinute: 0,
      workingEndHour: 20,
      workingEndMinute: 0,
      slotDurationMinutes: 30,
      consultationDurationMinutes: 60,
      breaks: [],
    }),
  },
}))

import { calendarRepository } from "@/modules/calendar/repositories/calendar-repository"
const mockGetAppointments = vi.mocked(calendarRepository.getActiveAppointmentsInRange)
const mockGetBlocked = vi.mocked(calendarRepository.getBlockedPeriodsInRange)
const mockGetConfig = vi.mocked(calendarRepository.getStudioConfig)

// ─── overlaps ─────────────────────────────────────────────────────────────────

describe("overlaps", () => {
  it("detecta solapamiento parcial", () => {
    const a = { s: new Date("2026-07-01T10:00:00Z"), e: new Date("2026-07-01T11:00:00Z") }
    const b = { s: new Date("2026-07-01T10:30:00Z"), e: new Date("2026-07-01T11:30:00Z") }
    expect(overlaps(a.s, a.e, b.s, b.e)).toBe(true)
  })

  it("detecta solapamiento total (B dentro de A)", () => {
    const a = { s: new Date("2026-07-01T10:00:00Z"), e: new Date("2026-07-01T12:00:00Z") }
    const b = { s: new Date("2026-07-01T10:30:00Z"), e: new Date("2026-07-01T11:30:00Z") }
    expect(overlaps(a.s, a.e, b.s, b.e)).toBe(true)
  })

  it("no detecta solapamiento en periodos contiguos (A termina donde B empieza)", () => {
    const a = { s: new Date("2026-07-01T10:00:00Z"), e: new Date("2026-07-01T11:00:00Z") }
    const b = { s: new Date("2026-07-01T11:00:00Z"), e: new Date("2026-07-01T12:00:00Z") }
    expect(overlaps(a.s, a.e, b.s, b.e)).toBe(false)
  })

  it("no detecta solapamiento en periodos separados", () => {
    const a = { s: new Date("2026-07-01T10:00:00Z"), e: new Date("2026-07-01T11:00:00Z") }
    const b = { s: new Date("2026-07-01T12:00:00Z"), e: new Date("2026-07-01T13:00:00Z") }
    expect(overlaps(a.s, a.e, b.s, b.e)).toBe(false)
  })
})

// ─── isWithinWorkingHours ─────────────────────────────────────────────────────

describe("isWithinWorkingHours", () => {
  it("acepta slot dentro del horario por defecto (10:00–11:00)", () => {
    const d = new Date("2026-07-01T10:00:00Z")
    const e = new Date("2026-07-01T11:00:00Z")
    expect(isWithinWorkingHours(d, e)).toBe(true)
  })

  it("acepta el último slot válido (19:00–20:00)", () => {
    const d = new Date("2026-07-01T19:00:00Z")
    const e = new Date("2026-07-01T20:00:00Z")
    expect(isWithinWorkingHours(d, e)).toBe(true)
  })

  it("rechaza slot que termina después de las 20:00", () => {
    const d = new Date("2026-07-01T19:30:00Z")
    const e = new Date("2026-07-01T20:30:00Z")
    expect(isWithinWorkingHours(d, e)).toBe(false)
  })

  it("rechaza slot que empieza antes de las 10:00", () => {
    const d = new Date("2026-07-01T09:30:00Z")
    const e = new Date("2026-07-01T10:30:00Z")
    expect(isWithinWorkingHours(d, e)).toBe(false)
  })

  it("respeta horario personalizado: acepta 12:00 con workingStartHour=12", () => {
    const config: CalendarConfig = { ...DEFAULT_CALENDAR_CONFIG, workingStartHour: 12 }
    const d = new Date("2026-07-01T12:00:00Z")
    const e = new Date("2026-07-01T13:00:00Z")
    expect(isWithinWorkingHours(d, e, config)).toBe(true)
  })

  it("respeta horario personalizado: rechaza 10:00 con workingStartHour=12", () => {
    const config: CalendarConfig = { ...DEFAULT_CALENDAR_CONFIG, workingStartHour: 12 }
    const d = new Date("2026-07-01T10:00:00Z")
    const e = new Date("2026-07-01T11:00:00Z")
    expect(isWithinWorkingHours(d, e, config)).toBe(false)
  })

  it("respeta horario personalizado: rechaza slot que termina después de workingEndHour=18", () => {
    const config: CalendarConfig = { ...DEFAULT_CALENDAR_CONFIG, workingEndHour: 18 }
    const d = new Date("2026-07-01T17:30:00Z")
    const e = new Date("2026-07-01T18:30:00Z")
    expect(isWithinWorkingHours(d, e, config)).toBe(false)
  })
})

// ─── isOccupied ───────────────────────────────────────────────────────────────

describe("isOccupied", () => {
  it("devuelve false si no hay periodos ocupados", () => {
    const start = new Date("2026-07-01T10:00:00Z")
    const end = new Date("2026-07-01T11:00:00Z")
    expect(isOccupied(start, end, [])).toBe(false)
  })

  it("devuelve true si hay solapamiento con un periodo ocupado", () => {
    const start = new Date("2026-07-01T10:00:00Z")
    const end = new Date("2026-07-01T11:00:00Z")
    const occupied = [
      { startsAt: new Date("2026-07-01T10:30:00Z"), endsAt: new Date("2026-07-01T11:30:00Z") },
    ]
    expect(isOccupied(start, end, occupied)).toBe(true)
  })

  it("devuelve false si el periodo ocupado es contiguo pero no se solapa", () => {
    const start = new Date("2026-07-01T10:00:00Z")
    const end = new Date("2026-07-01T11:00:00Z")
    const occupied = [
      { startsAt: new Date("2026-07-01T11:00:00Z"), endsAt: new Date("2026-07-01T12:00:00Z") },
    ]
    expect(isOccupied(start, end, occupied)).toBe(false)
  })
})

// ─── generateDaySlots ─────────────────────────────────────────────────────────

describe("generateDaySlots", () => {
  it("genera slots de 30 en 30 minutos desde las 10:00 con config por defecto", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    expect(slots[0]?.startsAt.getUTCHours()).toBe(10)
    expect(slots[0]?.startsAt.getUTCMinutes()).toBe(0)
  })

  it("el primer slot dura consultationDurationMinutes (60min)", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    const diff = (slots[0]!.endsAt.getTime() - slots[0]!.startsAt.getTime()) / 60000
    expect(diff).toBe(60)
  })

  it("el último slot empieza a las 19:00 (termina a las 20:00)", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    const last = slots[slots.length - 1]!
    expect(last.startsAt.getUTCHours()).toBe(19)
    expect(last.startsAt.getUTCMinutes()).toBe(0)
    expect(last.endsAt.getUTCHours()).toBe(20)
    expect(last.endsAt.getUTCMinutes()).toBe(0)
  })

  it("genera 19 slots por día con config por defecto (10:00–19:00 cada 30min)", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    expect(slots.length).toBe(19)
  })

  it("respeta workingStartHour personalizado: empieza a las 12:00", () => {
    const config: CalendarConfig = { ...DEFAULT_CALENDAR_CONFIG, workingStartHour: 12 }
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date, config)
    expect(slots[0]?.startsAt.getUTCHours()).toBe(12)
    expect(slots[0]?.startsAt.getUTCMinutes()).toBe(0)
  })

  it("respeta workingEndHour personalizado: no genera slots que terminen después de las 18:00", () => {
    const config: CalendarConfig = { ...DEFAULT_CALENDAR_CONFIG, workingEndHour: 18 }
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date, config)
    const last = slots[slots.length - 1]!
    expect(last.endsAt.getUTCHours()).toBeLessThanOrEqual(18)
  })
})

// ─── breaksToOccupiedPeriods ──────────────────────────────────────────────────

describe("breaksToOccupiedPeriods", () => {
  it("devuelve array vacío si no hay breaks", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    expect(breaksToOccupiedPeriods(date, [])).toHaveLength(0)
  })

  it("convierte un break a OccupiedPeriod con las horas UTC correctas", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const breaks = [
      { id: "1", label: "Comida", startHour: 14, startMinute: 0, endHour: 15, endMinute: 0 },
    ]
    const periods = breaksToOccupiedPeriods(date, breaks)
    expect(periods).toHaveLength(1)
    expect(periods[0]!.startsAt.getUTCHours()).toBe(14)
    expect(periods[0]!.endsAt.getUTCHours()).toBe(15)
  })

  it("genera un OccupiedPeriod por cada break configurado", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const breaks = [
      { id: "1", label: "Café", startHour: 11, startMinute: 0, endHour: 11, endMinute: 30 },
      { id: "2", label: "Comida", startHour: 14, startMinute: 0, endHour: 15, endMinute: 0 },
    ]
    expect(breaksToOccupiedPeriods(date, breaks)).toHaveLength(2)
  })
})

// ─── calendarService.getAvailableSlots ───────────────────────────────────────

describe("calendarService.getAvailableSlots", () => {
  beforeEach(() => {
    mockGetAppointments.mockResolvedValue([])
    mockGetBlocked.mockResolvedValue([])
    mockGetConfig.mockResolvedValue({ ...DEFAULT_CALENDAR_CONFIG })
  })

  it("devuelve slots disponibles en un día futuro sin ocupaciones", async () => {
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    expect(slots.length).toBeGreaterThan(0)
  })

  it("excluye slots solapados con una cita activa", async () => {
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    const busyStart = new Date(tomorrow)
    busyStart.setUTCHours(10, 0, 0, 0)
    const busyEnd = new Date(tomorrow)
    busyEnd.setUTCHours(11, 0, 0, 0)
    mockGetAppointments.mockResolvedValue([{ startsAt: busyStart, endsAt: busyEnd }])

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    const has10 = slots.some(
      (s) => s.startsAt.getUTCHours() === 10 && s.startsAt.getUTCMinutes() === 0
    )
    expect(has10).toBe(false)
  })

  it("excluye todos los slots de un día bloqueado por BlockedPeriod", async () => {
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    const blockStart = new Date(tomorrow)
    blockStart.setUTCHours(0, 0, 0, 0)
    const blockEnd = new Date(tomorrow)
    blockEnd.setUTCHours(23, 59, 0, 0)
    mockGetBlocked.mockResolvedValue([{ startsAt: blockStart, endsAt: blockEnd }])

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    expect(slots.length).toBe(0)
  })

  it("excluye slots durante un break configurado (RB-010)", async () => {
    mockGetConfig.mockResolvedValue({
      ...DEFAULT_CALENDAR_CONFIG,
      breaks: [
        { id: "1", label: "Comida", startHour: 14, startMinute: 0, endHour: 15, endMinute: 0 },
      ],
    })

    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    // El slot de 14:00 se solapa con el break 14:00–15:00
    const has14 = slots.some(
      (s) => s.startsAt.getUTCHours() === 14 && s.startsAt.getUTCMinutes() === 0
    )
    expect(has14).toBe(false)
  })

  it("usa workingStartHour personalizado — no genera slots antes de la hora configurada", async () => {
    mockGetConfig.mockResolvedValue({ ...DEFAULT_CALENDAR_CONFIG, workingStartHour: 12 })

    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    const before12 = slots.filter((s) => s.startsAt.getUTCHours() < 12)
    expect(before12.length).toBe(0)
  })

  it("usa workingEndHour personalizado — no genera slots que terminen después de la hora configurada", async () => {
    mockGetConfig.mockResolvedValue({ ...DEFAULT_CALENDAR_CONFIG, workingEndHour: 18 })

    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    const after18 = slots.filter((s) => s.endsAt.getUTCHours() > 18)
    expect(after18.length).toBe(0)
  })

  it("usa config por defecto cuando getStudioConfig devuelve null (fallback)", async () => {
    mockGetConfig.mockResolvedValue({ ...DEFAULT_CALENDAR_CONFIG })

    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    expect(slots.length).toBe(19) // 10:00–19:00 cada 30min = 19 slots
  })

  it("devuelve [] si el rango es completamente pasado", async () => {
    const past = new Date()
    past.setUTCDate(past.getUTCDate() - 10)
    const alsoPast = new Date()
    alsoPast.setUTCDate(alsoPast.getUTCDate() - 5)

    const slots = await calendarService.getAvailableSlots(past, alsoPast)
    expect(slots.length).toBe(0)
  })

  it("trunca el rango al límite de 60 días (RB-008)", async () => {
    const now = new Date()
    const from = new Date(now)
    from.setUTCDate(from.getUTCDate() + 59)
    from.setUTCHours(0, 0, 0, 0)
    const to = new Date(now)
    to.setUTCDate(to.getUTCDate() + 70)

    const slots = await calendarService.getAvailableSlots(from, to)
    const maxDate = new Date(now)
    maxDate.setUTCDate(maxDate.getUTCDate() + 60)
    for (const slot of slots) {
      expect(slot.startsAt.getTime()).toBeLessThanOrEqual(maxDate.getTime())
    }
  })
})

// ─── calendarService.assertSlotAvailable ─────────────────────────────────────

describe("calendarService.assertSlotAvailable", () => {
  beforeEach(() => {
    mockGetAppointments.mockResolvedValue([])
    mockGetBlocked.mockResolvedValue([])
    mockGetConfig.mockResolvedValue({ ...DEFAULT_CALENDAR_CONFIG })
  })

  it("no lanza error si el slot está libre", async () => {
    const start = new Date()
    start.setUTCDate(start.getUTCDate() + 1)
    start.setUTCHours(10, 0, 0, 0)
    const end = new Date(start)
    end.setUTCHours(11, 0, 0, 0)
    await expect(calendarService.assertSlotAvailable(start, end)).resolves.not.toThrow()
  })

  it("lanza SlotNotAvailableError si hay cita activa solapada", async () => {
    const start = new Date()
    start.setUTCDate(start.getUTCDate() + 1)
    start.setUTCHours(10, 0, 0, 0)
    const end = new Date(start)
    end.setUTCHours(11, 0, 0, 0)
    mockGetAppointments.mockResolvedValue([{ startsAt: start, endsAt: end }])

    await expect(calendarService.assertSlotAvailable(start, end)).rejects.toThrow(
      "El horario seleccionado ya no está disponible"
    )
  })

  it("lanza SlotNotAvailableError si el slot está fuera del horario laboral", async () => {
    const start = new Date()
    start.setUTCDate(start.getUTCDate() + 1)
    start.setUTCHours(8, 0, 0, 0)
    const end = new Date(start)
    end.setUTCHours(9, 0, 0, 0)

    await expect(calendarService.assertSlotAvailable(start, end)).rejects.toThrow(
      "El horario seleccionado ya no está disponible"
    )
  })

  it("lanza SlotNotAvailableError si hay un BlockedPeriod solapado", async () => {
    const start = new Date()
    start.setUTCDate(start.getUTCDate() + 1)
    start.setUTCHours(14, 0, 0, 0)
    const end = new Date(start)
    end.setUTCHours(15, 0, 0, 0)
    mockGetBlocked.mockResolvedValue([{ startsAt: start, endsAt: end }])

    await expect(calendarService.assertSlotAvailable(start, end)).rejects.toThrow(
      "El horario seleccionado ya no está disponible"
    )
  })

  it("lanza SlotNotAvailableError si el slot coincide con un break (RB-010)", async () => {
    mockGetConfig.mockResolvedValue({
      ...DEFAULT_CALENDAR_CONFIG,
      breaks: [
        { id: "1", label: "Comida", startHour: 14, startMinute: 0, endHour: 15, endMinute: 0 },
      ],
    })

    const start = new Date()
    start.setUTCDate(start.getUTCDate() + 1)
    start.setUTCHours(14, 0, 0, 0)
    const end = new Date(start)
    end.setUTCHours(15, 0, 0, 0)

    await expect(calendarService.assertSlotAvailable(start, end)).rejects.toThrow(
      "El horario seleccionado ya no está disponible"
    )
  })
})

// ─── filterStartSlotsByDuration ───────────────────────────────────────────────

describe("filterStartSlotsByDuration", () => {
  /**
   * Helper: genera slots de 30 min para el tramo [fromHour, toHour).
   * Incluye el slot de inicio en fromHour:00 hasta el slot en (toHour-0.5)*60 min.
   * Ejemplo: fromHour=10, toHour=18 → 10:00..17:30 = 16 slots (el slot 17:30 ends at 18:00)
   */
  function makeBase30Slots(
    dateStr: string,
    fromHour: number,
    toHour: number
  ): Array<{ startsAt: Date; endsAt: Date }> {
    const slots = []
    for (let h = fromHour; h < toHour; h++) {
      for (const m of [0, 30]) {
        const startsAt = new Date(
          `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`
        )
        const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000)
        slots.push({ startsAt, endsAt })
      }
    }
    return slots
  }

  it("devuelve solo los slots de inicio donde caben N horas consecutivas", () => {
    // 10:00–18:00 libres: slots 10:00..17:30 (16 slots). Pedimos 5h (10 slots).
    // Último inicio válido: 13:00 (13:00 + 5h = 18:00 — el slot 17:30 sí existe)
    const base = makeBase30Slots("2026-08-01", 10, 18)
    const result = filterStartSlotsByDuration(base, 300)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]!.startsAt.toISOString()).toBe("2026-08-01T10:00:00.000Z")
    const last = result[result.length - 1]!
    expect(last.startsAt.toISOString()).toBe("2026-08-01T13:00:00.000Z")
    expect(last.endsAt.toISOString()).toBe("2026-08-01T18:00:00.000Z")
  })

  it("devuelve 0 slots si hay un hueco que impide cubrir la duración", () => {
    // 10:00–13:00 libres (6 slots), hueco en 13:00, 13:30–17:30 libres (8 slots)
    // Pedimos 5h (10 slots) — ningún tramo de 10 consecutivos existe
    const morning = makeBase30Slots("2026-08-01", 10, 13) // 10:00..12:30 = 6 slots
    const afternoon = makeBase30Slots("2026-08-01", 14, 18) // 14:00..17:30 = 8 slots
    const result = filterStartSlotsByDuration([...morning, ...afternoon], 300)
    expect(result).toHaveLength(0)
  })

  it("durationMinutes=30 devuelve todos los slots base (equivalente al comportamiento sin filtro)", () => {
    const base = makeBase30Slots("2026-08-01", 10, 14)
    const result = filterStartSlotsByDuration(base, 30)
    expect(result).toHaveLength(base.length)
  })

  it("endsAt del resultado es startsAt + durationMinutes", () => {
    const base = makeBase30Slots("2026-08-01", 10, 18)
    const result = filterStartSlotsByDuration(base, 120) // 2h
    for (const slot of result) {
      const expectedEnd = new Date(slot.startsAt.getTime() + 120 * 60 * 1000)
      expect(slot.endsAt.getTime()).toBe(expectedEnd.getTime())
    }
  })

  it("devuelve array vacío si no hay slots base", () => {
    const result = filterStartSlotsByDuration([], 300)
    expect(result).toHaveLength(0)
  })
})

// ─── getAvailableSlots con durationMinutes ────────────────────────────────────

describe("calendarService.getAvailableSlots con durationMinutes", () => {
  // Use dates within MAX_DAYS_AHEAD (60 days) so they pass the range check
  const futureDay = new Date()
  futureDay.setUTCDate(futureDay.getUTCDate() + 10)
  const futureDayStr = futureDay.toISOString().slice(0, 10)
  const from = new Date(`${futureDayStr}T00:00:00.000Z`)
  const to = new Date(`${futureDayStr}T23:59:59.999Z`)

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAppointments.mockResolvedValue([])
    mockGetBlocked.mockResolvedValue([])
    mockGetConfig.mockResolvedValue({
      workingStartHour: 10,
      workingStartMinute: 0,
      workingEndHour: 20,
      workingEndMinute: 0,
      slotDurationMinutes: 30,
      consultationDurationMinutes: 60,
      breaks: [],
    })
  })

  it("sin durationMinutes devuelve slots de consultationDurationMinutes (no regresión)", async () => {
    const slots = await calendarService.getAvailableSlots(from, to)
    expect(slots.length).toBeGreaterThan(0)
    // Duración de cada slot debe ser 60 min (consultationDurationMinutes)
    const duration = slots[0]!.endsAt.getTime() - slots[0]!.startsAt.getTime()
    expect(duration).toBe(60 * 60 * 1000)
  })

  it("con durationMinutes=300 devuelve solo slots donde caben 5h consecutivas", async () => {
    const slots = await calendarService.getAvailableSlots(from, to, 300)
    expect(slots.length).toBeGreaterThan(0)
    // Duración de cada slot devuelto debe ser 300 min
    const duration = slots[0]!.endsAt.getTime() - slots[0]!.startsAt.getTime()
    expect(duration).toBe(300 * 60 * 1000)
    // El último inicio no debe superar las 15:00 (20:00 - 5h)
    const last = slots[slots.length - 1]!
    expect(last.startsAt.getUTCHours()).toBeLessThanOrEqual(15)
  })

  it("con BlockedPeriod en medio, los slots de inicio que lo incluyen son inválidos", async () => {
    // Bloqueo de 13:00 a 13:30 — rompe la cadena para cualquier inicio que lo atraviese
    mockGetBlocked.mockResolvedValue([
      {
        startsAt: new Date(`${futureDayStr}T13:00:00.000Z`),
        endsAt: new Date(`${futureDayStr}T13:30:00.000Z`),
      },
    ])
    const slots = await calendarService.getAvailableSlots(from, to, 300)
    const blockStart = new Date(`${futureDayStr}T13:00:00.000Z`)
    const blockEnd = new Date(`${futureDayStr}T13:30:00.000Z`)
    for (const slot of slots) {
      const crossesBlock = slot.startsAt < blockEnd && slot.endsAt > blockStart
      expect(crossesBlock).toBe(false)
    }
  })
})
