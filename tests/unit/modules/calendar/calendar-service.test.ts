import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  overlaps,
  isWithinWorkingHours,
  isOccupied,
  generateDaySlots,
  calendarService,
} from "@/modules/calendar/services/calendar-service"

// Mock del repositorio para aislar la lógica de negocio
vi.mock("@/modules/calendar/repositories/calendar-repository", () => ({
  calendarRepository: {
    getActiveAppointmentsInRange: vi.fn().mockResolvedValue([]),
    getBlockedPeriodsInRange: vi.fn().mockResolvedValue([]),
  },
}))

import { calendarRepository } from "@/modules/calendar/repositories/calendar-repository"
const mockGetAppointments = vi.mocked(calendarRepository.getActiveAppointmentsInRange)
const mockGetBlocked = vi.mocked(calendarRepository.getBlockedPeriodsInRange)

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
  it("acepta slot dentro del horario (10:00–11:00)", () => {
    const d = new Date("2026-07-01T10:00:00Z")
    const e = new Date("2026-07-01T11:00:00Z")
    expect(isWithinWorkingHours(d, e)).toBe(true)
  })

  it("acepta el último slot válido (19:30–20:00)", () => {
    const d = new Date("2026-07-01T19:30:00Z")
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
  it("genera slots de 30 en 30 minutos desde las 10:00", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    expect(slots[0]?.startAt.getUTCHours()).toBe(10)
    expect(slots[0]?.startAt.getUTCMinutes()).toBe(0)
  })

  it("el primer slot dura 60 minutos", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    const first = slots[0]!
    const diff = (first.endAt.getTime() - first.startAt.getTime()) / 60000
    expect(diff).toBe(60)
  })

  it("el último slot empieza a las 19:00 (termina a las 20:00)", () => {
    // Último slot válido de 60min: 19:00–20:00 (20:00 es el cierre exacto)
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    const last = slots[slots.length - 1]!
    expect(last.startAt.getUTCHours()).toBe(19)
    expect(last.startAt.getUTCMinutes()).toBe(0)
    expect(last.endAt.getUTCHours()).toBe(20)
    expect(last.endAt.getUTCMinutes()).toBe(0)
  })

  it("genera 19 slots por día (10:00–19:00 cada 30min con duración 60min)", () => {
    // Desde 10:00 hasta 19:00 inclusive en pasos de 30min: 19 slots
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    expect(slots.length).toBe(19)
  })
})

// ─── calendarService.getAvailableSlots ───────────────────────────────────────

describe("calendarService.getAvailableSlots", () => {
  beforeEach(() => {
    mockGetAppointments.mockResolvedValue([])
    mockGetBlocked.mockResolvedValue([])
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

    // Bloquear el slot de 10:00 UTC
    const busyStart = new Date(tomorrow)
    busyStart.setUTCHours(10, 0, 0, 0)
    const busyEnd = new Date(tomorrow)
    busyEnd.setUTCHours(11, 0, 0, 0)
    mockGetAppointments.mockResolvedValue([{ startsAt: busyStart, endsAt: busyEnd }])

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    const has10 = slots.some(
      (s) => s.startAt.getUTCHours() === 10 && s.startAt.getUTCMinutes() === 0
    )
    expect(has10).toBe(false)
  })

  it("excluye todos los slots de un día bloqueado por BlockedPeriod", async () => {
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    // Bloquear todo el día
    const blockStart = new Date(tomorrow)
    blockStart.setUTCHours(0, 0, 0, 0)
    const blockEnd = new Date(tomorrow)
    blockEnd.setUTCHours(23, 59, 0, 0)
    mockGetBlocked.mockResolvedValue([{ startsAt: blockStart, endsAt: blockEnd }])

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    expect(slots.length).toBe(0)
  })

  it("devuelve [] si el rango es completamente pasado", async () => {
    const past = new Date()
    past.setUTCDate(past.getUTCDate() - 10)
    const alsoPast = new Date()
    alsoPast.setUTCDate(alsoPast.getUTCDate() - 5)

    const slots = await calendarService.getAvailableSlots(past, alsoPast)
    expect(slots.length).toBe(0)
  })
})

// ─── calendarService.assertSlotAvailable ─────────────────────────────────────

describe("calendarService.assertSlotAvailable", () => {
  beforeEach(() => {
    mockGetAppointments.mockResolvedValue([])
    mockGetBlocked.mockResolvedValue([])
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
})
