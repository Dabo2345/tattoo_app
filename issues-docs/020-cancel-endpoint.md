# ISSUE DOC — #020: API POST /api/appointments/:id/cancel

## CONTEXTO
El cliente necesita poder cancelar su cita desde el enlace de gestión (magic link).
Este endpoint valida el token, aplica la DepositPolicy (#019) y cancela la cita.

## OBJETIVO
Implementar `POST /api/appointments/:id/cancel` que cancela una cita
autenticada con magic link token.

## SCOPE
- `src/app/api/appointments/[id]/cancel/route.ts` — Route Handler
- `src/modules/booking/repositories/booking-repository.ts` — métodos `findAppointmentById`, `cancelAppointment`, `findMagicLinkByHash`
- `tests/integration/api/cancel-appointment.test.ts` — tests de integración

## ANTI-SCOPE
- No implementar generación de magic links (issue #024)
- No enviar email de confirmación de cancelación (NOTIF-001)
- No implementar endpoint de admin para cancelar (issue #040)

## FLUJO DE EJECUCIÓN
1. Extraer `magicLinkToken` del body y `id` de los params
2. Hash SHA-256 del token → buscar MagicLink en DB
3. Validar: existe, no expirado, corresponde al appointment
4. Buscar Appointment → verificar que existe y está en estado cancelable
5. Llamar `depositPolicyService.handleCancellation(appointmentId, startsAt)`
6. Actualizar Appointment a `CANCELLED`
7. Devolver `{ cancelled: true, refunded, refundAmount }`

## REGLAS DE NEGOCIO
- RB-013/014: aplicadas por DepositPolicy
- MagicLink expirado o inválido → 410 LINK_EXPIRED
- Appointment ya cancelado → 409 o idempotente

## CRITERIOS DE ACEPTACIÓN
- [ ] Token válido + cita activa → cancela y aplica DepositPolicy
- [ ] Token inválido → 410 LINK_EXPIRED
- [ ] Token expirado → 410 LINK_EXPIRED
- [ ] Appointment no encontrado → 404 NOT_FOUND
- [ ] Tests de integración

## DEPENDENCIAS
- #19 ✅ — DepositPolicy

## DEFINITION OF DONE
- [ ] Route Handler implementado
- [ ] bookingRepository ampliado
- [ ] Tests pasando
- [ ] CI verde
