# ISSUE DOC #054 — Bugfix crítico: cancel/reschedule cliente no envían notificaciones

## CONTEXTO

Las rutas de cancelación y reprogramación del cliente (autenticadas via magic link) no llaman a `notificationService`. Las rutas admin equivalentes sí lo hacen.

- `POST /api/appointments/:id/cancel` — no llama a `sendAppointmentCancelled()`
- `POST /api/appointments/:id/reschedule` — no llama a `sendAppointmentRescheduled()`

**Root cause**: Estas rutas fueron implementadas antes del NotificationService (#049). Cuando se añadieron los triggers de notificación en #049, solo se actualizaron las rutas admin, no las rutas cliente.

**Impacto**: El cliente cancela o reprograma su cita via magic link y no recibe ningún email de confirmación.

## OBJETIVO

Añadir las llamadas a `notificationService` en ambas rutas cliente para que el cliente reciba:
- Email de cancelación con estado del reembolso tras cancelar
- Email de reprogramación con nueva fecha tras reprogramar

## SCOPE

- `src/app/api/appointments/[id]/cancel/route.ts` — añadir `sendAppointmentCancelled()`
- `src/app/api/appointments/[id]/reschedule/route.ts` — añadir `sendAppointmentRescheduled()`
- Actualizar tests de integración existentes: `tests/integration/api/cancel-appointment.test.ts` (si existe) o los tests de las rutas afectadas

## ANTI-SCOPE

- No modificar notificationService
- No cambiar las rutas admin (ya funcionan)

## ARCHIVOS AFECTADOS

```
src/app/api/appointments/[id]/cancel/route.ts       ← MODIFIED
src/app/api/appointments/[id]/reschedule/route.ts   ← MODIFIED
tests/integration/api/cancel-appointment.test.ts    ← UPDATE (añadir mock notif)
tests/integration/api/reschedule-appointment.test.ts ← UPDATE (ya tiene mock, verificar assertion)
issues-docs/054-bugfix-client-routes-missing-notifications.md ← NEW
```

## FLUJO DE EJECUCIÓN

### En cancel/route.ts
1. Importar `notificationService`
2. Añadir `await notificationService.sendAppointmentCancelled(appointmentId)` después del `auditService.log()` y antes del `return`

### En reschedule/route.ts
1. Importar `notificationService`
2. Capturar `appointment.startsAt` ANTES del reschedule (ya está capturado en la variable `appointment`)
3. Añadir `await notificationService.sendAppointmentRescheduled(appointmentId, appointment.startsAt)` después del `auditService.log()` y antes del `return`
   - **IMPORTANTE**: pasar `appointment.startsAt` (la fecha VIEJA, antes del reschedule) como `oldStartsAt`

## REGLAS DE NEGOCIO

- El cliente debe recibir confirmación por email de sus acciones
- Las notificaciones nunca deben bloquear la respuesta (notificationService ya maneja esto internamente con try/catch)
- El email de cancelación debe indicar si habrá reembolso

## CRITERIOS DE ACEPTACIÓN

- [ ] Cliente cancela cita → recibe email de cancelación
- [ ] Cliente reprograma cita → recibe email de reprogramación con fecha anterior y nueva
- [ ] Si el email falla → la operación no falla (notificationService silencia errores)
- [ ] Tests de integración verifican que se llama al método correcto de notificationService

## EDGE CASES

- `sendAppointmentRescheduled` requiere la fecha VIEJA — debe pasarse antes de hacer el update (ya está en la variable `appointment.startsAt` capturada antes del reschedule)

## TESTS REQUERIDOS

En `tests/integration/api/cancel-appointment.test.ts` (si existe):
- Añadir mock de `notificationService`
- Añadir assertion: `expect(mockSendAppointmentCancelled).toHaveBeenCalledWith(appointmentId)`

En `tests/integration/api/reschedule-appointment.test.ts` (ya tiene el mock):
- Añadir assertion: `expect(mockSendAppointmentRescheduled).toHaveBeenCalledWith(appointmentId, oldDate)`

## DOCUMENTACIÓN AFECTADA

- `docs/Documento 05 — API-001 ...` → Secciones de cancel y reschedule cliente: añadir que envían notificación por email

## DEPENDENCIAS

- #049 — NotificationService ✅

## DEFINITION OF DONE

- [ ] `sendAppointmentCancelled` llamado en ruta cliente cancel
- [ ] `sendAppointmentRescheduled` llamado en ruta cliente reschedule con la fecha anterior
- [ ] Tests actualizados y pasando
- [ ] `pnpm test --run` verde
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
