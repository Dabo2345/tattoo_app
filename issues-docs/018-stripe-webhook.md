# ISSUE DOC — #018: Stripe Webhook: confirmar appointment tras pago exitoso

## CONTEXTO
Tras el checkout de Stripe (#017), el cliente completa el pago en la página de Stripe.
Stripe notifica al sistema mediante un webhook POST. El sistema debe verificar la firma,
actualizar el Appointment a CONFIRMED, el Payment a PAID y registrar el AuditLog.

## OBJETIVO
Implementar el Route Handler `POST /api/webhooks/stripe` que procesa los eventos
de Stripe de forma segura e idempotente.

## SCOPE
- `src/app/api/webhooks/stripe/route.ts` — Route Handler
- `src/modules/payment/repositories/payment-repository.ts` — métodos adicionales
- `tests/unit/modules/payment/webhook-handler.test.ts` — unit tests

## ANTI-SCOPE
- No enviar email de confirmación (issue #019 / NOTIF-001)
- No implementar lógica de reembolso completa (solo marcar REFUNDED)
- No modificar el flujo de checkout existente

## ARCHIVOS AFECTADOS
- `src/app/api/webhooks/stripe/route.ts` (nuevo)
- `src/modules/payment/repositories/payment-repository.ts` (ampliar)
- `tests/unit/modules/payment/webhook-handler.test.ts` (nuevo)

## FLUJO DE EJECUCIÓN
1. Recibir raw body + header `stripe-signature`
2. Verificar firma con `stripe.webhooks.constructEvent`
3. Si firma inválida → 400
4. Switch en `event.type`:
   - `checkout.session.completed` → confirmar pago
   - `charge.refunded` → marcar REFUNDED
   - Desconocido → log + 200
5. Confirmación idempotente: si ya CONFIRMED → 200 sin modificar
6. Transacción: Appointment CONFIRMED + Payment PAID + AuditLog

## REGLAS DE NEGOCIO
- RB-003: Sin confirmación sin pago válido
- RA-004: Stripe solo desde backend
- Idempotencia: doble webhook no duplica acciones

## CRITERIOS DE ACEPTACIÓN
- [ ] Firma inválida → 400
- [ ] `checkout.session.completed` → Appointment CONFIRMED + Payment PAID
- [ ] Idempotente: doble evento no duplica
- [ ] Evento desconocido → log + 200
- [ ] AuditLog `CONSULTATION_CONFIRMED` creado

## EDGE CASES
- `payment_intent` puede ser string u objeto Stripe
- Appointment ya CONFIRMED (redelivery): ignorar silenciosamente
- Payment no encontrado: log error + 200 (no reintentar)
- Varios eventos en paralelo (Stripe retry): idempotencia protege

## TESTS REQUERIDOS
- Firma válida + `checkout.session.completed` → confirma + AuditLog
- Idempotente si ya CONFIRMED
- Firma inválida → 400
- Evento desconocido → 200
- `charge.refunded` → Payment REFUNDED

## DEPENDENCIAS
- #17 ✅ — Stripe client + PaymentRepository

## DEFINITION OF DONE
- [ ] Route Handler implementado
- [ ] PaymentRepository ampliado con métodos de confirmación
- [ ] Tests pasando
- [ ] CI verde
