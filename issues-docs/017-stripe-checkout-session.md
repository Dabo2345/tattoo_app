# ISSUE DOC — #017: Stripe: crear Checkout Session para depósito de consulta

**Rama:** `feature/017-stripe-checkout`
**Dependencias:** #011 (API helpers/errores) ✅, #016 (PaymentService stub) ✅

---

## 1. CONTEXTO

Cuando `BookingService.createConsultation` crea un Appointment en `PENDING_PAYMENT`, el endpoint `POST /api/consultations` necesita redirigir al cliente a Stripe para pagar el depósito. Este issue implementa el `PaymentService.createCheckoutSession` que era un stub en #016.

---

## 2. OBJETIVO

Implementar `paymentService.createCheckoutSession(appointmentId)` con Stripe real: crear la Checkout Session, guardar el Payment en DB con status `PENDING`, y devolver la URL de checkout.

---

## 3. SCOPE

- `src/lib/stripe/client.ts` — singleton Stripe (solo servidor)
- `src/modules/payment/services/payment-service.ts` — reemplaza el stub
- `src/modules/payment/repositories/payment-repository.ts` — crea registro Payment
- `tests/unit/modules/payment/payment-service.test.ts` — tests con Stripe mockeado

---

## 4. ANTI-SCOPE

- Webhook de confirmación de pago → issue #018
- Reembolsos → issue #019
- Configuración dinámica del importe del depósito → issue #045 (constante 50€ por ahora)
- Actualizar `depositAmount` en Appointment → se hace en #018 (post-confirmación)

---

## 5. ARCHIVOS AFECTADOS

| Archivo | Acción |
|---------|--------|
| `src/lib/stripe/client.ts` | CREAR |
| `src/modules/payment/repositories/payment-repository.ts` | CREAR |
| `src/modules/payment/services/payment-service.ts` | MODIFICAR (reemplazar stub) |
| `tests/unit/modules/payment/payment-service.test.ts` | CREAR |
| `package.json` / `pnpm-lock.yaml` | MODIFICAR (añadir `stripe`) |

---

## 6. FLUJO DE EJECUCIÓN

```
paymentService.createCheckoutSession(appointmentId)
  │
  ├─ stripe.checkout.sessions.create({ mode: "payment", ... })
  │       → PaymentFailedError si Stripe lanza excepción
  │       → PaymentFailedError si session.url es null
  │       → PaymentFailedError si no hay payment_intent
  │
  ├─ paymentRepository.createPayment({
  │     appointmentId,
  │     stripePaymentIntentId: session.payment_intent,
  │     amount: DEPOSIT_AMOUNT_EUR  (50€ por defecto)
  │   })
  │
  └─ return { checkoutUrl: session.url }
```

---

## 7. REGLAS DE NEGOCIO

| Regla | Descripción |
|-------|-------------|
| RB-002 | Toda consulta requiere depósito antes de confirmarse |
| RA-004 | Stripe solo accesible desde backend (nunca desde cliente) |
| AUTH-001 | `STRIPE_SECRET_KEY` nunca al cliente |

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] `paymentService.createCheckoutSession` devuelve `{ checkoutUrl }` con URL de Stripe
- [ ] Se crea registro `Payment` en DB con `status=PENDING` y `stripePaymentIntentId`
- [ ] Errores de Stripe se convierten en `PaymentFailedError`
- [ ] `stripe` nunca importado en código de cliente
- [ ] Tests con Stripe mockeado pasan en CI

---

## 9. TESTS REQUERIDOS

| Test | Descripción |
|------|-------------|
| Happy path | Stripe devuelve session → Payment creado → checkoutUrl devuelta |
| Stripe lanza error | → PaymentFailedError |
| Session sin URL | → PaymentFailedError |
| Session sin payment_intent | → PaymentFailedError |
| Payment guardado correctamente | stripePaymentIntentId, amount, status PENDING |

---

## 10. DEFINITION OF DONE

- [ ] `stripe` instalado en dependencias
- [ ] `src/lib/stripe/client.ts` exporta singleton
- [ ] `paymentRepository.createPayment` implementado
- [ ] `paymentService.createCheckoutSession` con Stripe real
- [ ] 5 tests pasan
- [ ] CI verde
