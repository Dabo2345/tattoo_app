# ISSUE #014 — GET /api/availability — Endpoint de slots disponibles

## Epic
EPIC 3 — Booking Engine Core

## Type
Task

## Priority
P0

## Dependencies
- #013 — CalendarService implementado y testado

---

## Contexto

El `CalendarService` (#013) ya sabe calcular qué slots están libres. Esta issue crea el endpoint REST público que expone esa información al frontend. Es el primer endpoint del booking engine y el que el cliente usará para mostrar el calendario de disponibilidad.

---

## Objetivo

Crear `GET /api/availability` que:
- Acepta query params `from`, `to` (ISO 8601 UTC) y opcionalmente `type`
- Valida los params con Zod
- Delega en `calendarService.getAvailableSlots(from, to)`
- Devuelve `{ success: true, data: TimeSlot[] }` con las fechas en ISO 8601
- Gestiona errores via `withErrorHandler`

---

## Scope

- Crear `src/app/api/availability/route.ts`
- Crear `tests/integration/api/availability.test.ts`
- Validación de entrada con Zod (query params)
- Respuesta formateada con `createApiResponse`

---

## Anti-scope

- No crear lógica de booking/pago (eso es #015)
- No proteger con auth (endpoint público por diseño — API-001)
- No implementar `type=tattoo` (solo `consultation` en MVP)
- No implementar paginación ni caché

---

## Archivos afectados

```
src/app/api/availability/
  route.ts                                ← CREAR
tests/integration/api/
  availability.test.ts                    ← CREAR
```

---

## Flujo de ejecución

1. Crear rama `feature/014-availability-endpoint` desde `feature/013-calendar-service`
2. Crear `src/app/api/availability/route.ts`
3. Crear `tests/integration/api/availability.test.ts`
4. `npm run typecheck && npm run test:run`
5. Crear PR

---

## Implementación

### src/app/api/availability/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { calendarService } from "@/modules/calendar/services/calendar-service"
import { createApiResponse } from "@/lib/api/response"
import { withErrorHandler } from "@/lib/api/middleware"

const querySchema = z.object({
  from: z.string().datetime({ message: "from debe ser una fecha ISO 8601 UTC válida" }),
  to: z.string().datetime({ message: "to debe ser una fecha ISO 8601 UTC válida" }),
  type: z.enum(["consultation"]).optional().default("consultation"),
})

export const GET = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams } = request.nextUrl
  const raw = {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  }

  const parsed = querySchema.parse(raw)
  const from = new Date(parsed.from)
  const to = new Date(parsed.to)

  const slots = await calendarService.getAvailableSlots(from, to)

  return createApiResponse(slots)
})
```

---

## Contrato de la API (API-001)

```
GET /api/availability?from=2026-07-01T00:00:00Z&to=2026-07-08T00:00:00Z

200 OK
{
  "success": true,
  "data": [
    { "startAt": "2026-07-01T10:00:00.000Z", "endAt": "2026-07-01T11:00:00.000Z" },
    { "startAt": "2026-07-01T10:30:00.000Z", "endAt": "2026-07-01T11:30:00.000Z" },
    ...
  ]
}

400 Bad Request (params inválidos)
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

---

## Reglas del sistema aplicables

- **API-001**: Toda entrada validada con Zod
- **API-002**: Respuesta tipada `{ success, data }`
- **API-003**: No exponer errores internos
- **API-004**: APIs públicas usan REST
- **RB-008**: CalendarService limita automáticamente a 60 días

---

## Criterios de aceptación

- [ ] `GET /api/availability?from=...&to=...` devuelve 200 con array de slots
- [ ] Params inválidos (fechas malformadas) devuelven 400 con `VALIDATION_ERROR`
- [ ] `from` y `to` ausentes devuelven 400
- [ ] `to < from` → devuelve 200 con array vacío (calendarService lo maneja)
- [ ] `pnpm typecheck` pasa sin errores

---

## Edge cases

- **`from` y `to` en el pasado**: calendarService devuelve `[]` — el endpoint devuelve `{ success: true, data: [] }`
- **`to - from` > 60 días**: calendarService clampea silenciosamente — se devuelve lo que hay dentro de los 60 días
- **Formato de fecha sin timezone**: Zod rechaza con `VALIDATION_ERROR` (`.datetime()` requiere UTC `Z`)
- **`type` no soportado**: Zod rechaza `type=tattoo` con `VALIDATION_ERROR`

---

## Tests requeridos

```typescript
// tests/integration/api/availability.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/availability/route"
import { NextRequest } from "next/server"

vi.mock("@/modules/calendar/services/calendar-service", () => ({
  calendarService: {
    getAvailableSlots: vi.fn().mockResolvedValue([]),
  },
}))

import { calendarService } from "@/modules/calendar/services/calendar-service"
const mockGetSlots = vi.mocked(calendarService.getAvailableSlots)

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/availability")
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url)
}

describe("GET /api/availability", () => {
  beforeEach(() => {
    mockGetSlots.mockResolvedValue([])
  })

  it("devuelve 200 con array vacío cuando no hay slots disponibles", async () => {
    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it("devuelve 200 con los slots que devuelve el servicio", async () => {
    const slot = {
      startAt: new Date("2026-07-01T10:00:00Z"),
      endAt: new Date("2026-07-01T11:00:00Z"),
    }
    mockGetSlots.mockResolvedValue([slot])

    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].startAt).toBe(slot.startAt.toISOString())
  })

  it("llama a calendarService con las fechas correctas", async () => {
    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
    })
    await GET(req)
    expect(mockGetSlots).toHaveBeenCalledWith(
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-07-08T00:00:00Z"),
    )
  })

  it("devuelve 400 si falta el param from", async () => {
    const req = makeRequest({ to: "2026-07-08T00:00:00Z" })
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si falta el param to", async () => {
    const req = makeRequest({ from: "2026-07-01T00:00:00Z" })
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si from no es una fecha ISO válida", async () => {
    const req = makeRequest({ from: "not-a-date", to: "2026-07-08T00:00:00Z" })
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si type tiene un valor no soportado", async () => {
    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
      type: "tattoo",
    })
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })
})
```

---

## Definition of Done

- [ ] `src/app/api/availability/route.ts` creado
- [ ] `tests/integration/api/availability.test.ts` creado y pasando
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run build` pasa
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
