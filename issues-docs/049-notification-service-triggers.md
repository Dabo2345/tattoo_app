# ISSUE DOC #049 — NotificationService: triggers automáticos

## CONTEXTO

Las issues #046–#048 completaron la infraestructura del módulo de notificaciones (cliente Resend, función `sendEmail`, repositorio, 6 templates React Email). Esta issue implementa el `NotificationService` que orquesta el flujo completo de envío y lo engancha en los puntos de trigger del sistema.

## OBJETIVO

Crear `NotificationService` con 6 métodos de trigger y conectarlos a los eventos del sistema que los disparan:
- Consulta confirmada (tras pago Stripe)
- Sesión tatuaje confirmada (tras bookTattooSession)
- Cita cancelada (admin cancel route)
- Cita reprogramada (admin reschedule route)
- MagicLink enviado (magic-link request route)
- SessionLink enviado (admin session-links route)

## SCOPE

- `src/modules/notification/services/notification-service.ts` ← NEW
- `src/app/api/webhooks/stripe/route.ts` ← MODIFIED (añade sendConsultationConfirmed)
- `src/modules/booking/services/booking-service.ts` ← MODIFIED (añade sendSessionConfirmed)
- `src/app/api/admin/appointments/[id]/cancel/route.ts` ← MODIFIED (añade sendAppointmentCancelled)
- `src/app/api/admin/appointments/[id]/reschedule/route.ts` ← MODIFIED (añade sendAppointmentRescheduled)
- `src/app/api/magic-links/request/route.ts` ← MODIFIED (añade sendMagicLink)
- `src/app/api/admin/session-links/route.ts` ← MODIFIED (añade sendSessionLink)
- `tests/unit/modules/notification/notification-service.test.ts` ← NEW

## ANTI-SCOPE

- No implementar reminder system (eso es #050)
- No modificar templates de email
- No cambiar el modelo de datos

## ARCHIVOS AFECTADOS

```
src/modules/notification/services/notification-service.ts         ← NEW
src/app/api/webhooks/stripe/route.ts                              ← MODIFIED
src/modules/booking/services/booking-service.ts                   ← MODIFIED
src/app/api/admin/appointments/[id]/cancel/route.ts               ← MODIFIED
src/app/api/admin/appointments/[id]/reschedule/route.ts           ← MODIFIED
src/app/api/magic-links/request/route.ts                          ← MODIFIED
src/app/api/admin/session-links/route.ts                          ← MODIFIED
tests/unit/modules/notification/notification-service.test.ts      ← NEW
```

## FLUJO DE EJECUCIÓN

Para cada método del servicio (NP-003, NP-005):
1. Cargar appointment + client + datos adicionales desde DB
2. Crear registro Notification con `status: PENDING`
3. Renderizar template React Email con `createElement(Template, payload)`
4. Llamar `sendEmail`
5. Si éxito → `markSent`. Si error → `markFailed` + log
6. **Nunca lanzar excepción** (el flujo principal ya completó)

## REGLAS DE NEGOCIO

- NP-003: Toda notificación fallida se registra en DB con FAILED. No lanza excepción.
- NP-005: Notificaciones no bloquean la respuesta al cliente.
- Para `sendConsultationConfirmed`: se crea un MagicLink nuevo antes del envío.
- Para `sendAppointmentRescheduled`: requiere `oldStartsAt` porque la fecha ya fue sobreescrita.
- `refundEligible` en cancelled: >= 4 días antes de la cita Y hay Payment.
- `refundDays` es constante: 5 días hábiles.
- URLs: magic-link → `APP_URL/magic-link/{token}`, session-link → `APP_URL/book/{token}`.

## CRITERIOS DE ACEPTACIÓN

- [ ] `notificationService` exportado desde `/src/modules/notification/services/notification-service.ts`
- [ ] 6 métodos implementados: sendConsultationConfirmed, sendSessionConfirmed, sendAppointmentCancelled, sendAppointmentRescheduled, sendMagicLink, sendSessionLink
- [ ] Cada método: crea Notification PENDING → sendEmail → markSent/markFailed
- [ ] Ningún método lanza excepción (try/catch que loguea y retorna)
- [ ] Stripe webhook llama sendConsultationConfirmed tras confirmar pago
- [ ] bookTattooSession llama sendSessionConfirmed tras crear appointment
- [ ] Admin cancel route llama sendAppointmentCancelled
- [ ] Admin reschedule route llama sendAppointmentRescheduled
- [ ] Magic-link request route llama sendMagicLink
- [ ] Admin session-links route llama sendSessionLink

## TESTS REQUERIDOS

| Test | Tipo | Descripción |
|------|------|-------------|
| sendConsultationConfirmed crea Notification PENDING | Unit | Verifica que se llama notificationRepository.create |
| sendConsultationConfirmed llama sendEmail | Unit | Verifica que se llama sendEmail |
| sendConsultationConfirmed markSent en éxito | Unit | Si sendEmail devuelve success:true, llama markSent |
| sendConsultationConfirmed markFailed en error | Unit | Si sendEmail devuelve success:false, llama markFailed |
| sendConsultationConfirmed no lanza | Unit | Aunque todo falle, no lanza excepción |
| sendSessionConfirmed crea Notification PENDING | Unit | Similar al anterior |
| sendSessionConfirmed markSent en éxito | Unit | Similar |
| sendMagicLink usa el token para construir URL | Unit | La URL en el payload contiene el token |
| sendAppointmentCancelled refundAmount=0 sin payment | Unit | Si no hay payment, refundAmount es 0 |

## DEPENDENCIAS

- #046 — Setup Resend ✅
- #047 — Templates consultation + session ✅
- #048 — Templates cancelled + rescheduled + magic-link + session-link ✅

## DEFINITION OF DONE

- [ ] `notification-service.ts` implementado con 6 métodos
- [ ] Los 6 puntos de integración modificados
- [ ] Tests unitarios pasando (9+ tests)
- [ ] TypeScript sin errores
- [ ] ESLint sin errores
- [ ] CI verde
