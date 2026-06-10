# ISSUE DOC #036 — Página SessionLink (/session-link/:token): reserva de sesión de tatuaje

## CONTEXTO

Tras completar una consulta, el artista genera un SessionLink y lo envía al cliente por email.
El cliente accede a `/session-link/[token]` para seleccionar fecha y reservar su TattooSession.

A diferencia del MagicLink, el SessionLink es **de un solo uso** (RB-006): una vez el cliente
reserva, el enlace queda consumido y no puede usarse de nuevo.

La página es no-indexable (`robots: noindex`) y no requiere login (RB-001).

---

## OBJETIVO

1. **Page Server Component** — valida el token via `GET /api/session-links/:token` en el servidor
   - Si error 410 o `LINK_EXPIRED`: muestra `ExpiredSessionView`
   - Si error 409 o `LINK_ALREADY_USED`: muestra `AlreadyUsedView`
   - Si 200 y `valid: true`: muestra `SessionBooking` con los datos del enlace

2. **`SessionBooking`** — client component con el flujo completo de reserva:
   - Date picker (input nativo) → fetch slots de `/api/availability` con `type=tattoo_session`
   - Slot grid → confirmación inline → `POST /api/session-links/:token/book` con `{ startAt }`
   - Estados: loading, success, error

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/(public)/session-link/[token]/page.tsx` | Modificar — reemplazar placeholder con Server Component completo |
| `src/modules/booking/components/session-booking.tsx` | Crear — Client Component |
| `tests/unit/modules/booking/session-booking.test.tsx` | Crear — tests unitarios |

---

## ANTI-SCOPE

- NO autenticación (el token ES el mecanismo de identidad)
- NO modificar las APIs (implementadas en #027)
- NO pago online (RB-004: TattooSessions nunca requieren pago)
- NO permitir cancelar ni reprogramar desde esta página (eso es MagicLink, #035)
- NO reutilizar `AppointmentManager` de #035
- NO Modal de #028 (confirmaciones inline)

---

## FLUJO DE EJECUCIÓN

1. Page fetches token en servidor → pasa `SessionLinkData` a `SessionBooking` o muestra vista de error
2. `SessionBooking` muestra detalles de la sesión (duración, expira en)
3. Cliente selecciona fecha → se llama a `GET /api/availability?type=tattoo_session&from=...&to=...`
4. Se muestra grid de slots disponibles
5. Cliente selecciona slot → aparece confirmación inline
6. Confirmar → `POST /api/session-links/:token/book` con `{ startAt }`
7. Éxito → `BookingSuccessView`; Error → mensaje de error con opción de reintentar

---

## REGLAS DE NEGOCIO (DATA-002)

- **RB-004**: TattooSessions nunca requieren pago online → no mostrar ningún elemento de pago
- **RB-005**: Solo se puede reservar mediante SessionLink válido
- **RB-006**: SessionLink single-use → tras booking, mostrar vista de confirmación final; si se intenta reutilizar, mostrar `AlreadyUsedView`
- **RB-008**: Slots visibles limitados a los próximos 60 días
- **RB-012**: No se permiten reservas solapadas → la API rechazará el slot con `SLOT_NOT_AVAILABLE`

---

## CONTRATO DE API (API-001)

### GET /api/session-links/:token

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2026-07-01T12:00:00.000Z",
    "durationMinutes": 180
  }
}
```

**Respuesta error:**
```json
{
  "success": false,
  "error": { "code": "LINK_EXPIRED" | "LINK_ALREADY_USED" | "NOT_FOUND", "message": "..." }
}
```
- HTTP 410 → `LINK_EXPIRED`
- HTTP 409 → `LINK_ALREADY_USED`
- HTTP 404 → `NOT_FOUND`

---

### POST /api/session-links/:token/book

**Body:**
```json
{ "startAt": "2026-07-15T10:00:00.000Z" }
```

**Respuesta 201:**
```json
{ "success": true, "data": { "appointmentId": "..." } }
```

**Errores posibles:**
- `SLOT_NOT_AVAILABLE` → slot ya ocupado
- `LINK_ALREADY_USED` → enlace ya consumido
- `LINK_EXPIRED` → enlace expirado

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Token expirado (HTTP 410) → muestra `ExpiredSessionView` con mensaje claro
- [ ] Token ya usado (HTTP 409) → muestra `AlreadyUsedView` con mensaje claro
- [ ] Token válido → muestra `SessionBooking` con duración de la sesión y fecha de expiración del enlace
- [ ] Date picker filtra fechas pasadas y más allá de 60 días
- [ ] Al seleccionar fecha → se cargan los slots disponibles (estado loading)
- [ ] Sin slots disponibles → mensaje explicativo
- [ ] Slot seleccionado → confirmación inline antes de enviar
- [ ] POST booking exitoso → `BookingSuccessView` con mensaje de confirmación
- [ ] POST booking falla con `SLOT_NOT_AVAILABLE` → mensaje de error + opción de elegir otro slot
- [ ] POST booking falla con `LINK_ALREADY_USED` → muestra `AlreadyUsedView`
- [ ] Estados loading durante cada acción async
- [ ] Page `robots: noindex`
- [ ] Todos los tests pasan

---

## EDGE CASES

- El enlace expira mientras el cliente está en la página (el POST devolverá 410 → mostrar `ExpiredSessionView`)
- Otro cliente reserva el mismo slot antes de que este confirme (SLOT_NOT_AVAILABLE → volver a selección de slot)
- `durationMinutes` devuelto por la API se muestra como información informativa; el sistema de slots es uniforme de 30min (la API calcula la duración internamente)
- El token no existe en BD (404) → tratar igual que expirado (`ExpiredSessionView`)
- La fecha de expiración del enlace puede ser en pocas horas → mostrarla de forma legible

---

## TESTS REQUERIDOS

### Unit (`tests/unit/modules/booking/session-booking.test.tsx`, happy-dom)

- Renderiza los detalles de la sesión (duración, expiración)
- Botón "Elegir fecha" muestra el date picker
- Al seleccionar fecha llama a `GET /api/availability` con `type=tattoo_session`
- Muestra slots disponibles tras la respuesta
- Sin slots disponibles muestra mensaje vacío
- Slot seleccionado muestra confirmación inline
- Confirmación llama a `POST /api/session-links/:token/book` con `{ startAt }` correcto
- POST exitoso muestra `BookingSuccessView`
- POST con `SLOT_NOT_AVAILABLE` muestra error y permite reintentar
- POST con `LINK_ALREADY_USED` muestra `AlreadyUsedView`

---

## DEPENDENCIAS

- #027 (APIs SessionLink: GET /:token y POST /:token/book)
- #028 (Button, componentes UI base)
- #029 (referencia de slot grid — reusar patrón visual, no el componente)

---

## ARCHIVOS AFECTADOS

```
src/app/(public)/session-link/[token]/page.tsx        ← Modificar
src/modules/booking/components/session-booking.tsx    ← Crear
tests/unit/modules/booking/session-booking.test.tsx   ← Crear
```

---

## DEFINITION OF DONE

- [ ] `page.tsx` reemplaza el placeholder con Server Component completo
- [ ] `session-booking.tsx` implementa el flujo completo de reserva
- [ ] Tests: mínimo 10 casos, todos pasando
- [ ] TypeScript sin errores (`tsc --noEmit`)
- [ ] Lint limpio
- [ ] PR creado con descripción completa
