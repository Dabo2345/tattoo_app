# ISSUE #013 — CalendarService: motor de slots de 30min y disponibilidad

## Epic
EPIC 3 — Booking Engine Core

## Type
Task

## Priority
P0

## Dependencies
- #011 — API helpers, middleware y tipos base disponibles

---

## Contexto

Antes de que un cliente pueda reservar una consulta, el sistema necesita saber qué huecos de tiempo están libres. El `CalendarService` es el motor que responde esa pregunta: dada una ventana de fechas, calcula qué slots de 30 minutos están disponibles teniendo en cuenta el horario laboral, las citas existentes y los periodos bloqueados. Sin este motor no puede existir el endpoint de disponibilidad (#014) ni la lógica de creación de consultas (#015).

---

## Objetivo

Implementar el `CalendarService` y su `CalendarRepository` asociado. El servicio debe:
- Generar slots de 30 minutos dentro del horario laboral (10:00–20:00)
- Filtrar slots ocupados por citas activas y `BlockedPeriod`
- Verificar si un slot concreto está disponible (necesario en #015 al crear una Consultation)
- Cumplir las reglas de negocio RB-008 a RB-012 de DATA-002

---

## Scope

- Crear `/src/modules/calendar/types/index.ts` con los tipos del módulo
- Crear `/src/modules/calendar/repositories/calendar-repository.ts` con queries Prisma
- Crear `/src/modules/calendar/services/calendar-service.ts` con la lógica de negocio
- Horario laboral hardcodeado: 10:00–20:00 (configurable en #045)
- Duración de slot unitario: 30 minutos
- Duración de una Consultation: 60 minutos (2 slots)
- Lookahead máximo: 60 días desde hoy (RB-008)

---

## Anti-scope

- No crear el endpoint HTTP `/api/availability` (eso es #014)
- No crear lógica de Consultation ni Booking (eso es #015)
- No implementar configuración dinámica de horarios (eso es #045)
- No implementar pausas configurables (eso es #045)
- No gestionar TattooSession slots (duración variable, depende del SessionLink)

---

## Archivos afectados

```
src/modules/calendar/
  types/
    index.ts                           ← CREAR
  repositories/
    calendar-repository.ts             ← CREAR
  services/
    calendar-service.ts                ← CREAR
tests/unit/modules/calendar/
  calendar-service.test.ts             ← CREAR
```

---

## Flujo de ejecución

1. Crear rama `feature/013-calendar-service` desde `develop`
2. Crear `/src/modules/calendar/types/index.ts`
3. Crear `/src/modules/calendar/repositories/calendar-repository.ts`
4. Crear `/src/modules/calendar/services/calendar-service.ts`
5. Escribir tests unitarios (lógica pura de slots)
6. `pnpm typecheck && pnpm lint && pnpm test:run`
7. Crear PR a `develop`

---

## Implementación

### /src/modules/calendar/types/index.ts

```typescript
export type TimeSlot = {
  startAt: Date
  endAt: Date
}

export type WorkingHours = {
  startHour: number  // 10
  startMinute: number // 0
  endHour: number    // 20
  endMinute: number  // 0
}

export type OccupiedPeriod = {
  startsAt: Date
  endsAt: Date
}
```

### /src/modules/calendar/repositories/calendar-repository.ts

```typescript
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
```

### /src/modules/calendar/services/calendar-service.ts

```typescript
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
export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart
}

/**
 * Comprueba si un slot está dentro del horario laboral del día.
 * El slot completo (start + duration) debe caber dentro de 10:00–20:00.
 */
export function isWithinWorkingHours(startAt: Date, endAt: Date): boolean {
  const startMinutes = startAt.getHours() * 60 + startAt.getMinutes()
  const endMinutes = endAt.getHours() * 60 + endAt.getMinutes()
  const workStart = WORKING_START_HOUR * 60
  const workEnd = WORKING_END_HOUR * 60
  return startMinutes >= workStart && endMinutes <= workEnd
}

/**
 * Comprueba si un periodo se solapa con alguno de los periodos ocupados.
 */
export function isOccupied(
  startAt: Date,
  endAt: Date,
  occupied: OccupiedPeriod[]
): boolean {
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
    startAt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

    const endAt = new Date(startAt)
    endAt.setMinutes(endAt.getMinutes() + CONSULTATION_DURATION_MINUTES)

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
    cursor.setHours(0, 0, 0, 0)

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

      cursor.setDate(cursor.getDate() + 1)
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
```

---

## Reglas del sistema aplicables

- **RB-008**: Slots limitados a los próximos 60 días desde hoy
- **RB-009**: Horario laboral por defecto 10:00–20:00 (hardcoded hasta #045)
- **RB-011**: `BlockedPeriod` tiene prioridad absoluta — bloquea los slots del rango
- **RB-012**: No se permiten reservas solapadas — se excluyen PENDING_PAYMENT y CONFIRMED
- **BA-002**: `CalendarService` no importa nada de `next/server` — framework-agnostic
- **BA-003**: `CalendarRepository` no contiene lógica de negocio, solo queries Prisma
- **BP-005**: Todo acceso a BD via Prisma, nunca SQL crudo

---

## Criterios de aceptación

- [ ] `getAvailableSlots` devuelve slots de 60min en intervalos de 30min (10:00, 10:30, 11:00…)
- [ ] `getAvailableSlots` no devuelve slots en el pasado
- [ ] `getAvailableSlots` no devuelve slots que solapen con citas PENDING_PAYMENT o CONFIRMED
- [ ] `getAvailableSlots` no devuelve slots que solapen con BlockedPeriods
- [ ] `getAvailableSlots` no devuelve slots más allá de 60 días desde hoy
- [ ] `getAvailableSlots` no devuelve slots fuera del horario 10:00–20:00
- [ ] `assertSlotAvailable` lanza `SlotNotAvailableError` si hay solapamiento
- [ ] `assertSlotAvailable` lanza `SlotNotAvailableError` si el slot está fuera del horario laboral
- [ ] `pnpm typecheck` pasa sin errores

---

## Edge cases

- **Rango vacío**: si `from >= to` después de clampear, devolver `[]`
- **Todo el rango es pasado**: `rangeStart >= rangeEnd` → `[]`
- **`to` supera 60 días**: clampear silenciosamente a `now + 60 días`
- **Cita CANCELLED no bloquea**: solo PENDING_PAYMENT y CONFIRMED se consideran ocupados
- **Slot exactamente en el borde del horario**: 19:30–20:30 **no** es válido (20:30 > 20:00); 19:30–20:00 **sí** (último slot válido)
- **BlockedPeriod de todo un día**: bloquea todos los slots del día
- **Zona horaria**: todas las fechas se almacenan en UTC. El cliente envía fechas UTC y recibe UTC. La conversión a zona local es responsabilidad del frontend

---

## Tests requeridos

```typescript
// tests/unit/modules/calendar/calendar-service.test.ts

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

// ─── generateDaySlots ─────────────────────────────────────────────────────────

describe("generateDaySlots", () => {
  it("genera slots de 30 en 30 minutos desde las 10:00", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    expect(slots[0]?.startAt.getHours()).toBe(10)
    expect(slots[0]?.startAt.getMinutes()).toBe(0)
  })

  it("el primer slot dura 60 minutos", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    const first = slots[0]!
    const diff = (first.endAt.getTime() - first.startAt.getTime()) / 60000
    expect(diff).toBe(60)
  })

  it("el último slot empieza a las 19:30 (termina a las 20:00)", () => {
    const date = new Date("2026-07-01T00:00:00Z")
    const slots = generateDaySlots(date)
    const last = slots[slots.length - 1]!
    expect(last.startAt.getHours()).toBe(19)
    expect(last.startAt.getMinutes()).toBe(30)
    expect(last.endAt.getHours()).toBe(20)
  })

  it("genera 19 slots por día (10:00–19:30 cada 30min)", () => {
    // Desde 10:00 hasta 19:30 inclusive: (19*60+30 - 10*60) / 30 + 1 = 19 slots
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
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    expect(slots.length).toBeGreaterThan(0)
  })

  it("excluye slots solapados con una cita activa", async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // Bloquear el slot de 10:00
    const busyStart = new Date(tomorrow)
    busyStart.setHours(10, 0, 0, 0)
    const busyEnd = new Date(tomorrow)
    busyEnd.setHours(11, 0, 0, 0)
    mockGetAppointments.mockResolvedValue([{ startsAt: busyStart, endsAt: busyEnd }])

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    const has10 = slots.some((s) => s.startAt.getHours() === 10 && s.startAt.getMinutes() === 0)
    expect(has10).toBe(false)
  })

  it("excluye todos los slots de un día bloqueado por BlockedPeriod", async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // Bloquear todo el día
    const blockStart = new Date(tomorrow)
    blockStart.setHours(0, 0, 0, 0)
    const blockEnd = new Date(tomorrow)
    blockEnd.setHours(23, 59, 0, 0)
    mockGetBlocked.mockResolvedValue([{ startsAt: blockStart, endsAt: blockEnd }])

    const slots = await calendarService.getAvailableSlots(tomorrow, dayAfter)
    expect(slots.length).toBe(0)
  })

  it("devuelve [] si el rango supera los 60 días y no hay días válidos", async () => {
    const past = new Date()
    past.setDate(past.getDate() - 10)
    const alsoPast = new Date()
    alsoPast.setDate(alsoPast.getDate() - 5)

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
    start.setDate(start.getDate() + 1)
    start.setHours(10, 0, 0, 0)
    const end = new Date(start)
    end.setHours(11, 0, 0, 0)
    await expect(calendarService.assertSlotAvailable(start, end)).resolves.not.toThrow()
  })

  it("lanza SlotNotAvailableError si hay cita activa solapada", async () => {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    start.setHours(10, 0, 0, 0)
    const end = new Date(start)
    end.setHours(11, 0, 0, 0)
    mockGetAppointments.mockResolvedValue([{ startsAt: start, endsAt: end }])

    await expect(calendarService.assertSlotAvailable(start, end)).rejects.toThrow(
      "El horario seleccionado ya no está disponible"
    )
  })

  it("lanza SlotNotAvailableError si el slot está fuera del horario laboral", async () => {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    start.setHours(8, 0, 0, 0)
    const end = new Date(start)
    end.setHours(9, 0, 0, 0)

    await expect(calendarService.assertSlotAvailable(start, end)).rejects.toThrow(
      "El horario seleccionado ya no está disponible"
    )
  })
})
```

---

## Definition of Done

- [ ] `/src/modules/calendar/types/index.ts` creado
- [ ] `/src/modules/calendar/repositories/calendar-repository.ts` creado
- [ ] `/src/modules/calendar/services/calendar-service.ts` creado con helpers puros exportados
- [ ] Tests unitarios creados y pasando
- [ ] `pnpm typecheck` pasa sin errores
- [ ] `pnpm build` pasa
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
