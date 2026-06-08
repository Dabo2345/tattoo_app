# ISSUE DOC — #016: API POST /api/consultations

**Rama:** `feature/016-consultations-endpoint`
**Dependencias:** #015 (BookingService) ✅, #017 (Stripe) — paralelo

---

## 1. CONTEXTO

El endpoint `POST /api/consultations` es el punto de entrada público del flujo de reserva. Recibe los datos del cliente y el slot elegido, delega la lógica al `BookingService` (#015) y al `PaymentService` (#017), y devuelve el `appointmentId` y la URL de Stripe Checkout para que el frontend redirija al pago.

---

## 2. OBJETIVO

Crear el Route Handler `POST /api/consultations` que valida el body con Zod, llama a `bookingService.createConsultation` y a `paymentService.createCheckoutSession`, y devuelve `{ appointmentId, stripeCheckoutUrl }`. Usar `withErrorHandler` para gestión de errores.

---

## 3. SCOPE

- `src/app/api/consultations/route.ts` — Route Handler principal
- `src/modules/payment/types/index.ts` — Tipos del módulo de pagos
- `src/modules/payment/services/payment-service.ts` — Stub de interfaz (implementación completa en #017)
- `tests/integration/api/consultations.test.ts` — Tests de integración del endpoint

---

## 4. ANTI-SCOPE

- Implementación Stripe real (`stripe.checkout.sessions.create`) → issue #017
- Webhook de confirmación de pago → issue #018
- `depositAmount` configurado dinámicamente → issue #045

---

## 5. ARCHIVOS AFECTADOS

| Archivo | Acción |
|---------|--------|
| `src/app/api/consultations/route.ts` | CREAR |
| `src/modules/payment/types/index.ts` | CREAR |
| `src/modules/payment/services/payment-service.ts` | CREAR (stub) |
| `tests/integration/api/consultations.test.ts` | CREAR |

---

## 6. FLUJO DE EJECUCIÓN

```
POST /api/consultations
  │
  ├─ withErrorHandler (captura ZodError → 400, DomainError → código correcto)
  │
  ├─ 1. Parsear body con createConsultationSchema
  │       → ZodError si datos inválidos (400 VALIDATION_ERROR)
  │
  ├─ 2. bookingService.createConsultation(parsed)
  │       → SlotNotAvailableError si slot ocupado (409 SLOT_NOT_AVAILABLE)
  │       → Devuelve { appointmentId, clientId }
  │
  ├─ 3. paymentService.createCheckoutSession(appointmentId)
  │       → PaymentFailedError si Stripe falla (402 PAYMENT_FAILED)
  │       → Devuelve { checkoutUrl }
  │
  └─ 4. createApiResponse({ appointmentId, stripeCheckoutUrl: checkoutUrl }, 201)
```

---

## 7. CONTRATO API (API-001)

**Request:**
```json
POST /api/consultations
Content-Type: application/json

{
  "name": "Ana García",
  "email": "ana@example.com",
  "phone": "+34612345678",
  "tattooDescription": "Rosa pequeña en muñeca",
  "startsAt": "2026-08-01T10:00:00Z",
  "endsAt": "2026-08-01T11:00:00Z"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "appointmentId": "uuid-xxx",
    "stripeCheckoutUrl": "https://checkout.stripe.com/pay/..."
  }
}
```

**Errores:**
- `400 VALIDATION_ERROR` — body inválido
- `409 SLOT_NOT_AVAILABLE` — slot ocupado
- `402 PAYMENT_FAILED` — error de Stripe
- `500 INTERNAL_ERROR` — error inesperado

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] `POST /api/consultations` con datos válidos devuelve 201 con `appointmentId` y `stripeCheckoutUrl`
- [ ] Body inválido → 400 `VALIDATION_ERROR`
- [ ] Slot ocupado → 409 `SLOT_NOT_AVAILABLE`
- [ ] Tests de integración del endpoint pasan en CI

---

## 9. TESTS REQUERIDOS

| Test | Descripción |
|------|-------------|
| 201 happy path | Datos válidos → bookingService + paymentService llamados, respuesta correcta |
| 400 body inválido | Email mal formado → VALIDATION_ERROR |
| 400 campos faltantes | Falta `startsAt` → VALIDATION_ERROR |
| 409 slot ocupado | bookingService lanza SlotNotAvailableError → 409 |
| 402 pago fallido | paymentService lanza PaymentFailedError → 402 |

---

## 10. DEPENDENCIAS

| Issue | Estado |
|-------|--------|
| #015 BookingService | ✅ Completada |
| #017 Stripe Checkout | 🔄 Paralela (stub en este issue) |

---

## 11. DEFINITION OF DONE

- [ ] Route handler implementado con `withErrorHandler`
- [ ] Stub `paymentService.createCheckoutSession` define la interfaz
- [ ] 5 tests de integración pasan
- [ ] CI verde
- [ ] PR apuntando a `develop`
