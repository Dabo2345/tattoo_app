# ISSUE DOC #078 — Bugfix: SessionLink no muestra horarios disponibles

**Issue GitHub:** #078
**Tipo:** bug
**Prioridad:** P1: High
**Rama:** `fix/078-session-link-availability-slots`
**Estado:** PENDIENTE
**Fecha:** 2026-06-30

---

## 1. CONTEXTO

En la página `/session-link/:token`, al seleccionar una fecha nunca aparecen horarios disponibles aunque los haya. La causa son dos bugs encadenados en el flujo de disponibilidad para sesiones de tatuaje.

---

## 2. ROOT CAUSE

### Bug 1 — API rechaza `type: "tattoo_session"` con error de validación

`src/app/api/availability/route.ts` define el parámetro `type` como:
```typescript
type: z.enum(["consultation"]).optional().default("consultation"),
```

`session-booking.tsx` envía `type: "tattoo_session"` en la query. Zod lanza `ZodError` → `withErrorHandler` devuelve HTTP 400 → el componente recibe `body.data ?? []` → array vacío → "No hay horarios disponibles".

### Bug 2 — `generateDaySlots` usa siempre `consultationDurationMinutes` (60 min)

Incluso si se acepta `tattoo_session`, `calendarService.getAvailableSlots` llama a `generateDaySlots` con la config del estudio, que usa `consultationDurationMinutes` para calcular cuántos slots caben en el día. Una sesión de tatuaje puede durar 120-480 min, por lo que los slots generados son incorrectos (demasiado cortos, incompatibles con la duración real).

Además, `session-booking.tsx` no pasa `durationMinutes` (que sí tiene disponible en `data.durationMinutes`) a la API.

---

## 3. OBJETIVO

Que la página de SessionLink muestre los horarios realmente disponibles para la duración de sesión que el admin ha configurado.

---

## 4. SCOPE

1. **`src/app/api/availability/route.ts`** — ampliar el schema:
   - `type: z.enum(["consultation", "tattoo_session"])`
   - nuevo param opcional: `durationMinutes: z.coerce.number().int().min(30).max(480).optional()`
   - pasar `durationMinutes` a `calendarService.getAvailableSlots`

2. **`src/modules/calendar/services/calendar-service.ts`** — soportar duración dinámica:
   - `getAvailableSlots(from, to, durationMinutes?: number)` — si se pasa `durationMinutes`, usarlo en lugar de `config.consultationDurationMinutes`
   - `generateDaySlots(date, config, durationMinutes?: number)` — usar la duración recibida para calcular `endsAt` y el `lastStart` del día

3. **`src/modules/booking/components/session-booking.tsx`** — pasar la duración a la query:
   - Añadir `durationMinutes: String(data.durationMinutes)` a los `URLSearchParams` de la llamada a `/api/availability`

---

## 5. ANTI-SCOPE

- NO cambiar la lógica de booking (POST `/api/session-links/:token/book`)
- NO modificar `assertSlotAvailable` (ya recibe `startAt`/`endAt` calculados)
- NO cambiar el flujo de consultas (`type: "consultation"`) — debe seguir funcionando igual
- NO tocar el frontend de consultas (`BookingWizard`)

---

## 6. ARCHIVOS AFECTADOS

### Código
- `src/app/api/availability/route.ts`
- `src/modules/calendar/services/calendar-service.ts`
- `src/modules/booking/components/session-booking.tsx`

### Tests
- `tests/unit/modules/calendar/calendar-service.test.ts` — añadir casos con `durationMinutes` personalizado
- `tests/integration/api/availability.test.ts` — añadir caso `type=tattoo_session&durationMinutes=120`

### Docs
- `docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md` — sección `GET /api/availability`

---

## 7. FLUJO DE EJECUCIÓN

1. Leer los 3 archivos de código afectados
2. Modificar `calendar-service.ts`:
   - `generateDaySlots` acepta `durationMinutes?: number` (fallback a `config.consultationDurationMinutes`)
   - `getAvailableSlots` acepta `durationMinutes?: number` y lo pasa a `generateDaySlots`
3. Modificar `availability/route.ts`:
   - Ampliar schema con `tattoo_session` y `durationMinutes`
   - Pasar `durationMinutes` a `calendarService.getAvailableSlots`
4. Modificar `session-booking.tsx`:
   - Añadir `durationMinutes` al `URLSearchParams`
5. Añadir/actualizar tests
6. Actualizar API-001
7. Verificar CI verde
8. Crear PR

---

## 8. REGLAS DE NEGOCIO

- **RB-008:** Máximo 60 días hacia adelante
- **RB-009:** Slots dentro del horario laboral configurado
- **RB-010:** Breaks bloquean slots automáticamente
- **RB-011:** BlockedPeriods bloquean el período completo
- **RB-012:** Sin solapamiento con citas existentes
- **RB-SL-DUR-001:** Los slots mostrados al cliente deben tener la duración exacta configurada en el SessionLink (`sessionDurationMinutes`)

---

## 9. CRITERIOS DE ACEPTACIÓN

- [ ] Al abrir un SessionLink y seleccionar una fecha con disponibilidad real, aparecen los horarios disponibles
- [ ] Los slots mostrados respetan la duración de la sesión (`durationMinutes`) — si la sesión es de 180 min, no aparecen slots que no tengan 180 min libres
- [ ] El flujo de consultas (`/reservar`) sigue funcionando igual que antes
- [ ] `GET /api/availability?type=consultation` funciona igual que antes (sin romper nada)
- [ ] `GET /api/availability?type=tattoo_session&durationMinutes=120` devuelve slots correctos
- [ ] CI verde

---

## 10. EDGE CASES

- **`durationMinutes` no enviado con `type=tattoo_session`:** Usar `consultationDurationMinutes` como fallback (no romper)
- **`durationMinutes` mayor que la jornada laboral:** No habrá slots válidos — devolver array vacío (comportamiento correcto)
- **Día sin slots por ocupación:** Devolver array vacío (comportamiento existente sin cambios)

---

## 11. TESTS REQUERIDOS

### Unit — `calendar-service.test.ts`
- `generateDaySlots` con `durationMinutes=120` genera slots de 120 min (endsAt correcto, lastStart correcto)
- `getAvailableSlots` con `durationMinutes=120` filtra correctamente ocupaciones de 120 min

### Integration — `availability.test.ts`
- `GET /api/availability?type=tattoo_session&durationMinutes=120` devuelve 200 con slots
- `GET /api/availability?type=tattoo_session` (sin `durationMinutes`) devuelve 200 (fallback)
- `GET /api/availability?type=invalid` devuelve 400 VALIDATION_ERROR

---

## 12. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `API-001` | `GET /api/availability` | Añadir parámetros `type: "tattoo_session"` y `durationMinutes` con descripción y ejemplos |

---

## 13. DEPENDENCIAS

Ninguna.

---

## 14. DEFINITION OF DONE

- [ ] Bug 1 resuelto: API acepta `type=tattoo_session`
- [ ] Bug 2 resuelto: slots generados con la duración correcta de la sesión
- [ ] `session-booking.tsx` pasa `durationMinutes` a la query
- [ ] Tests unitarios e integración añadidos
- [ ] CI verde
- [ ] API-001 actualizado
- [ ] PR creado
