# ISSUE DOC — #021: API POST /api/appointments/:id/reschedule

## CONTEXTO
El cliente necesita poder reprogramar su cita desde el enlace de gestión (magic link).
Este endpoint valida el token, aplica RB-015 (bloquea si <4 días) y actualiza el horario.

## OBJETIVO
Implementar `POST /api/appointments/:id/reschedule` que reprograma una cita
autenticada con magic link token a un nuevo horario validado contra CalendarService.

## SCOPE
- `src/app/api/appointments/[id]/reschedule/route.ts` — Route Handler
- `src/modules/booking/repositories/booking-repository.ts` — método `rescheduleAppointment`
- `src/lib/api/errors.ts` — error `RescheduleNotAllowedError`
- `src/types/api.ts` — código `RESCHEDULE_NOT_ALLOWED`
- `tests/integration/api/reschedule-appointment.test.ts` — tests de integración

## ANTI-SCOPE
- No enviar email de confirmación de reprogramación (NOTIF-001)
- No implementar endpoint de admin para reprogramar (issue #040)
- No regenerar MagicLink tras reprogramar (issue #024)

## FLUJO DE EJECUCIÓN
1. Extraer `magicLinkToken` y `newStartAt` del body; `id` de los params
2. Hash SHA-256 del token → buscar MagicLink en DB
3. Validar: existe, no expirado, corresponde al appointment
4. Buscar Appointment → verificar que existe y está en estado CONFIRMED
5. RB-015: si daysUntilAppointment(startsAt) < 4 → 409 RESCHEDULE_NOT_ALLOWED
6. Calcular newEndsAt = newStartAt + 60 min
7. Validar nuevo slot con calendarService.assertSlotAvailable(newStartAt, newEndsAt)
8. Actualizar Appointment con nuevos startsAt/endsAt
9. Crear AuditLog APPOINTMENT_RESCHEDULED
10. Devolver `{ rescheduled: true, newStartAt, newEndsAt }`

## REGLAS DE NEGOCIO
- RB-015: Reprogramar con menos de 4 días equivale a cancelar → 409 RESCHEDULE_NOT_ALLOWED
- MagicLink expirado o inválido → 410 LINK_EXPIRED
- Appointment no CONFIRMED → 409 (no reprogramable)
- Nuevo slot no disponible → 409 SLOT_NOT_AVAILABLE

## CRITERIOS DE ACEPTACIÓN
- [ ] Token válido + cita CONFIRMED + ≥4 días + slot libre → reprograma
- [ ] Token inválido → 410 LINK_EXPIRED
- [ ] Token expirado → 410 LINK_EXPIRED
- [ ] Cita dentro de 4 días → 409 RESCHEDULE_NOT_ALLOWED
- [ ] Nuevo slot no disponible → 409 SLOT_NOT_AVAILABLE
- [ ] Cita ya CANCELLED → 409
- [ ] Tests de integración

## DEPENDENCIAS
- #019 ✅ — DepositPolicy (daysUntilAppointment)
- #020 ✅ — Cancel endpoint (patrón MagicLink)

## DEFINITION OF DONE
- [ ] Route Handler implementado
- [ ] bookingRepository ampliado
- [ ] Tests pasando
- [ ] CI verde
