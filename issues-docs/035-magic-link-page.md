# ISSUE DOC #035 — Página MagicLink (/magic-link/:token): gestión de cita

## CONTEXTO

El cliente recibe un MagicLink por email y accede a `/magic-link/[token]` para gestionar su
cita (ver detalles, cancelar, reprogramar). El token se valida mediante la API de #025.

Esta página es no-indexable (`robots: noindex`) y no requiere login.

---

## OBJETIVO

1. **Page Server Component** — valida el token via `GET /api/magic-links/[token]` en el servidor
   - Si 410/error: muestra `ExpiredView` con formulario para solicitar nuevo enlace
   - Si 200: muestra `AppointmentManager` con los datos de la cita

2. **`AppointmentManager`** — client component con dos flujos:
   - **Cancelar**: confirmación inline → `POST /api/appointments/:id/cancel`
   - **Reprogramar**: date input + slot grid → `POST /api/appointments/:id/reschedule`

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/(public)/magic-link/[token]/page.tsx` | Modificar — Server Component completo |
| `src/modules/booking/components/appointment-manager.tsx` | Crear — Client Component |
| `tests/unit/modules/booking/appointment-manager.test.tsx` | Crear — tests |

---

## ANTI-SCOPE

- NO autenticación (el token ES el mecanismo de identidad)
- NO modificar la API (ya implementada en #025)
- NO Modal de #028 (inline confirmations)
- NO CalendarPublic de #029 (usar date input nativo)

---

## FLUJO DE EJECUCIÓN

1. Page fetches token en servidor, pasa data a AppointmentManager o muestra ExpiredView
2. AppointmentManager muestra detalles + botones de acción
3. Cancelar: confirmación → POST cancel → success/error message
4. Reprogramar: date input → fetch slots → slot selection → POST reschedule → success/error
5. Tests: render, cancel flow, reschedule flow

---

## REGLAS DE NEGOCIO (DATA-002)

- Si token expirado → mostrar opción de solicitar nuevo enlace (POST /api/magic-links/request)
- Cancel: POST /api/appointments/:id/cancel → appointment CANCELLED
- Reschedule: POST /api/appointments/:id/reschedule { newStartAt } → nueva fecha
- MagicLink multiuse (no se invalida al usar, solo expira a las 2h)

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Token expirado → mensaje de expiración + formulario de solicitud
- [ ] Token válido → datos de la cita visibles (fecha, hora, tipo, estado)
- [ ] Botón "Cancelar" → confirmación inline → POST cancel → mensaje resultado
- [ ] Botón "Reprogramar" → date input → slots → confirm → POST reschedule
- [ ] Estados loading durante cada acción
- [ ] Mensajes de error si API falla
- [ ] Page no indexable (robots: noindex)
- [ ] Todos los tests pasan

---

## TESTS REQUERIDOS

### Unit (`tests/unit/modules/booking/appointment-manager.test.tsx`, happy-dom)
- Renderiza detalles de la cita
- Botón cancelar muestra confirmación
- Confirmación de cancelación llama a POST /api/appointments/:id/cancel
- Botón reprogramar muestra date input
- Con fecha y slot seleccionado llama a POST reschedule

---

## DEPENDENCIAS

- #025 (GET/POST magic-links API)
- #020 (cancel endpoint)
- #021 (reschedule endpoint)
- #028 (Button)

---

## DEFINITION OF DONE

- [ ] Archivos creados/modificados
- [ ] Tests pasando
- [ ] Suite verde
- [ ] PR creado
