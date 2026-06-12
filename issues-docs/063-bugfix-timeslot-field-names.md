---
# ISSUE DOC #063 — Bugfix crítico: TimeSlot startAt/endAt vs startsAt/endsAt rompe el flujo de reserva

## CONTEXTO

El flujo de reserva de cliente en `/reservar` está completamente roto. Al seleccionar una fecha y avanzar al paso de horario, los botones de hora muestran **"Invalid Date"** y al confirmar la reserva el backend rechaza la petición.

**Root cause**: Mismatch de nombres de campo entre el tipo `TimeSlot` del backend y la interfaz local del frontend.

| Capa | Campos | Fichero |
|------|--------|---------|
| Backend — `TimeSlot` type | `startAt` / `endAt` | `src/modules/calendar/types/index.ts` |
| Frontend — interfaz local | `startsAt` / `endsAt` | `src/modules/booking/components/booking-wizard.tsx:11-14` |

**Traza del error:**

1. `GET /api/availability` devuelve `[{ startAt: "...", endAt: "..." }]`
2. El wizard hace `slot.startsAt` → `undefined` (el campo real es `startAt`)
3. `formatTime(undefined)` → `new Date(undefined)` → `Invalid Date` en los botones de hora
4. Al enviar el formulario: `body: { startsAt: undefined }` → Zod lo rechaza en `/api/consultations`
5. El terminal muestra error de validación con "horario inválido"

**Nota**: El resto del sistema (Prisma, BookingService, notificaciones, session-booking) ya usa `startsAt`/`endsAt` de forma consistente. El único lugar que usa `startAt`/`endAt` es el tipo `TimeSlot` y el `CalendarService` que lo construye.

## OBJETIVO

Renombrar los campos `startAt`/`endAt` del tipo `TimeSlot` a `startsAt`/`endsAt` para que sean consistentes con el resto del sistema y con la interfaz del frontend.

## SCOPE

- `src/modules/calendar/types/index.ts` — cambiar campos del tipo `TimeSlot`
- `src/modules/calendar/services/calendar-service.ts` — actualizar referencias a los campos renombrados
- `tests/unit/modules/calendar/calendar-service.test.ts` — actualizar tests que acceden a los campos
- `tests/integration/api/availability.test.ts` — actualizar mock y assertion

## ANTI-SCOPE

- No modificar `booking-wizard.tsx` (ya usa los nombres correctos `startsAt`/`endsAt`)
- No modificar los parámetros de funciones como `assertSlotAvailable(startAt, endAt)` — son variables locales, no campos de objeto
- No modificar `isWithinWorkingHours`, `isOccupied`, `overlaps` — sus parámetros son variables locales, no afectados
- No cambiar el esquema de Prisma ni datos de DB
- No tocar `session-booking.tsx` (flujo diferente, no parte de este bug)

## ARCHIVOS AFECTADOS

```
src/modules/calendar/types/index.ts                          ← MODIFIED (TimeSlot fields)
src/modules/calendar/services/calendar-service.ts            ← MODIFIED (referencias a campos)
tests/unit/modules/calendar/calendar-service.test.ts         ← MODIFIED (tests acceden a campos)
tests/integration/api/availability.test.ts                   ← MODIFIED (mock + assertion)
issues-docs/063-bugfix-timeslot-field-names.md               ← NEW
```

## FLUJO DE EJECUCIÓN

### 1. Actualizar `src/modules/calendar/types/index.ts`

Renombrar campos de `TimeSlot`:
```typescript
// Antes:
export type TimeSlot = {
  startAt: Date
  endAt: Date
}

// Después:
export type TimeSlot = {
  startsAt: Date
  endsAt: Date
}
```

### 2. Actualizar `src/modules/calendar/services/calendar-service.ts`

**En `generateDaySlots` (línea 46):** Cambiar tipo de retorno inline.

**Dentro de `generateDaySlots` (líneas 55-61):** Renombrar variables locales `startAt`/`endAt` → `startsAt`/`endsAt` para consistencia, y actualizar el `slots.push(...)`.

**En `getAvailableSlots` (líneas 104-110):** Actualizar las cuatro referencias `slot.startAt` y `slot.endAt` a `slot.startsAt` y `slot.endsAt`.

### 3. Actualizar `tests/unit/modules/calendar/calendar-service.test.ts`

Cambiar todos los accesos a campos de slot (`startAt`/`endAt`) en los tests de `generateDaySlots` y `getAvailableSlots` a `startsAt`/`endsAt`.

### 4. Actualizar `tests/integration/api/availability.test.ts`

Cambiar el mock slot de `{ startAt, endAt }` a `{ startsAt, endsAt }` y actualizar la assertion `body.data[0].startAt` → `body.data[0].startsAt`.

## CRITERIOS DE ACEPTACIÓN

- [ ] El tipo `TimeSlot` en `types/index.ts` tiene campos `startsAt` y `endsAt`
- [ ] Los botones de hora en `/reservar` muestran horas en formato correcto (ej. "10:00")
- [ ] Se puede seleccionar una hora y pasar al siguiente paso del wizard
- [ ] Se puede completar el formulario y ser redirigido al checkout de Stripe
- [ ] `pnpm typecheck` sin errores
- [ ] `pnpm test --run` verde (todos los tests)

## EDGE CASES

- `formatTime(undefined)` ya no puede ocurrir — el campo siempre estará presente con el nombre correcto
- Los tests que mockean slots con `{ startAt, endAt }` deben actualizarse para que no introduzcan una regresión silenciosa

## TESTS REQUERIDOS

No se añaden tests nuevos — se actualizan los existentes para reflejar el rename. Los tests de `calendar-service.test.ts` ya cubren `generateDaySlots` y `getAvailableSlots`.

## DOCUMENTACIÓN AFECTADA

- `docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md` → Actualizar la forma del response de `GET /api/availability` para reflejar que los campos son `startsAt`/`endsAt`

## DEPENDENCIAS

Ninguna. Este bug es independiente.

## DEFINITION OF DONE

- [ ] `TimeSlot` usa `startsAt`/`endsAt`
- [ ] `calendar-service.ts` actualizado sin errores de tipo
- [ ] Tests existentes actualizados y pasando
- [ ] `pnpm typecheck` verde
- [ ] `pnpm test --run` verde
- [ ] Docs `API-001` actualizado con la forma correcta del response
- [ ] PR mergeado a develop
