# ISSUE DOC #052 — Integration tests: APIs de booking, pagos y magic links

## CONTEXTO

Los endpoints de booking, magic links, session links y cancel ya tienen integration tests. El único gap crítico es `POST /api/webhooks/stripe` — zero tests. Además, los tests de magic-links y reschedule no verifican las llamadas a notificationService (añadidas en #049).

## OBJETIVO

1. Crear `tests/integration/api/stripe-webhook.test.ts` con cobertura completa del webhook (happy path, idempotencia, errores de auth, eventos desconocidos, charge.refunded)
2. Actualizar `tests/integration/api/magic-links.test.ts` para añadir mock de notificationService y verificar la llamada a sendMagicLink
3. Actualizar `tests/integration/api/reschedule-appointment.test.ts` para añadir mock de notificationService

## SCOPE

- `tests/integration/api/stripe-webhook.test.ts` ← NEW
- `tests/integration/api/magic-links.test.ts` ← MODIFIED (notificationService mock + test)
- `tests/integration/api/reschedule-appointment.test.ts` ← MODIFIED (notificationService mock)

## ANTI-SCOPE

- No tests de DB real (se mantiene el patrón de mocks de vitest existente)
- No MSW (el proyecto usa vi.mock, no MSW)
- No modificar código de producción

## ARCHIVOS AFECTADOS

```
issues-docs/052-integration-tests-booking-payments-links.md               ← NEW
tests/integration/api/stripe-webhook.test.ts                              ← NEW
tests/integration/api/magic-links.test.ts                                 ← MODIFIED
tests/integration/api/reschedule-appointment.test.ts                      ← MODIFIED
```

## TESTS REQUERIDOS

### POST /api/webhooks/stripe (nuevo)
| Test | Descripción |
|------|-------------|
| Sin stripe-signature → 400 | Header ausente devuelve 400 |
| Firma inválida → 400 | constructEvent lanza → 400 |
| checkout.session.completed happy path | confirmPayment + auditLog + sendConsultationConfirmed |
| checkout.session.completed idempotente | Si ya PAID → skip, devuelve 200 |
| checkout.session.completed sin appointmentId | Metadata vacía → no confirma, devuelve 200 |
| charge.refunded happy path | findByPaymentIntentId + refundPayment |
| charge.refunded sin payment_intent | Warn + devuelve 200 sin refund |
| Evento desconocido → 200 | Tipo no reconocido → ignorado, devuelve 200 |

### magic-links.test.ts (actualización)
| Test | Descripción |
|------|-------------|
| sendMagicLink llamado tras crear link | Verifica que notificationService.sendMagicLink se llama |

### reschedule-appointment.test.ts (actualización)
| Acción | Descripción |
|--------|-------------|
| Añadir mock notificationService | sendAppointmentRescheduled no bloquea tests existentes |

## DEPENDENCIAS

- #049 — NotificationService con triggers ✅
- #025 — APIs MagicLink ✅
- #027 — APIs SessionLink ✅
- #020 — API cancel ✅

## DEFINITION OF DONE

- [ ] `stripe-webhook.test.ts` con 8+ tests
- [ ] `magic-links.test.ts` actualizado con notificationService mock + assertion
- [ ] `reschedule-appointment.test.ts` actualizado con notificationService mock
- [ ] `pnpm test` verde (suite completa)
- [ ] TypeScript sin errores
