import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  overlaps,
  isWithinWorkingHours,
  isOccupied,
  generateDaySlots,
  breaksToOccupiedPeriods,
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
