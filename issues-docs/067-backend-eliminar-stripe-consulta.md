# ISSUE DOC #067 — Backend: Eliminar Stripe del flujo de consulta

**Issue GitHub:** #067  
**Tipo:** refactor  
**Epic:** EPIC 3 — Booking Core  
**Rama:** `refactor/067-backend-eliminar-stripe-consulta`  
**Estado:** PENDIENTE  
**Fecha:** 2026-06-18  

---

## 1. CONTEXTO

El flujo de reserva de consulta inicial requería un depósito vía Stripe (€50) para confirmar la cita. El negocio ha decidido eliminar este requisito: las consultas se confirman directamente sin pago, simplificando el proceso para el cliente y reduciendo la fricción en la conversión.

El flujo actual es:
```
POST /api/consultations → Appointment(PENDING_PAYMENT) + Payment + Stripe checkout → webhook → CONFIRMED + email
```

El flujo nuevo debe ser:
```
POST /api/consultations → Appointment(CONFIRMED) + email de confirmación
```

---

## 2. OBJETIVO

Modificar el backend para que la creación de una consulta genere directamente un `Appointment` en estado `CONFIRMED`, sin crear registro `Payment` ni sesión de Stripe Checkout. El email de confirmación se dispara desde la propia API, no desde el webhook.

---

## 3. SCOPE

- Modificar `BookingService.createConsultation` para que el appointment nazca en `CONFIRMED`
- Eliminar la llamada a `PaymentService.createCheckoutSession` del flujo de consulta
- Eliminar la creación del registro `Payment` en el flujo de consulta
- Disparar `NotificationService.sendConsultationConfirmed` directamente desde `/api/consultations`
- Actualizar `/api/admin/appointments/:id/cancel` para que no intente reembolsar si no existe `Payment`
- Mantener el webhook de Stripe intacto (no eliminarlo) — puede haber citas antiguas `PENDING_PAYMENT` o usarse en el futuro para sesiones de tatuaje

---

## 4. ANTI-SCOPE

- NO eliminar `PaymentService`, `DepositPolicy`, ni el modelo `Payment` de Prisma
- NO eliminar el webhook handler de Stripe
- NO modificar el flujo de `TattooSession` (sessionLinks siguen funcionando igual)
- NO cambiar la UI del BookingWizard (eso es issue #068)
- NO tocar las APIs de magic-links ni session-links
- NO modificar el schema de Prisma

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/modules/booking/services/booking-service.ts` — `createConsultation`: cambiar `status: PENDING_PAYMENT` → `CONFIRMED`, eliminar llamada a `paymentService`
- `src/app/api/consultations/route.ts` — eliminar `paymentService.createCheckoutSession`, añadir trigger de notificación, cambiar respuesta (ya no devuelve `checkoutUrl`)
- `src/app/api/admin/appointments/[id]/cancel/route.ts` — proteger la lógica de reembolso con guard: solo ejecutar si existe `Payment` asociado
- `src/modules/notification/services/notification-service.ts` — verificar que `sendConsultationConfirmed` acepta `appointmentId` directamente (sin depender del webhook)

### Tests
- `tests/unit/booking-service.test.ts` — actualizar tests de `createConsultation`
- `tests/integration/consultations.test.ts` — actualizar flow: ya no espera `checkoutUrl`

### Docs
- `docs/Documento 04 — DATA-002 — Reglas de Negocio del Dominio.md`
- `docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md`
- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md`

---

## 6. FLUJO DE EJECUCIÓN

1. Leer `booking-service.ts` completo — identificar `createConsultation` y sus dependencias
2. Leer `src/app/api/consultations/route.ts` completo
3. Leer `src/app/api/admin/appointments/[id]/cancel/route.ts`
4. Modificar `BookingService.createConsultation`:
   - Cambiar `status: AppointmentStatus.PENDING_PAYMENT` → `AppointmentStatus.CONFIRMED`
   - Eliminar `await paymentService.createCheckoutSession(appointment.id)`
   - Eliminar creación del registro `Payment`
   - El método ya no retorna `checkoutUrl`; retorna solo el `appointment`
5. Modificar `/api/consultations` route:
   - Eliminar llamada a `paymentService`
   - Añadir `await notificationService.sendConsultationConfirmed(appointment.id)` después de crear appointment
   - Cambiar respuesta de `{ success: true, data: { checkoutUrl } }` → `{ success: true, data: { appointmentId, status: 'CONFIRMED' } }`
6. Modificar cancel route:
   - Añadir guard: `if (!appointment.payment) { /* skip refund logic */ }`
   - Proceder con cancelación sin reembolso si no hay Payment
7. Actualizar tests unitarios e integración
8. Actualizar docs indicados

---

## 7. REGLAS DE NEGOCIO

- **RB-NEW-001:** Una consulta inicial no requiere pago. Se confirma automáticamente al crearse.
- **RB-NEW-002:** El email de confirmación de consulta se envía inmediatamente tras crear el appointment.
- **RB-NEW-003:** Al cancelar una consulta sin Payment asociado, no se ejecuta ninguna lógica de reembolso.
- **RB-003 (eliminada):** ~~La consulta requiere depósito de €50 para confirmar.~~ — DEPRECADA
- El webhook de Stripe `checkout.session.completed` conserva su lógica actual pero ya no será invocado por nuevas consultas.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] `POST /api/consultations` devuelve `{ success: true, data: { appointmentId, status: 'CONFIRMED' } }` (sin `checkoutUrl`)
- [ ] El appointment creado tiene `status: CONFIRMED` en base de datos
- [ ] No se crea ningún registro `Payment` al crear una consulta
- [ ] El email de confirmación se envía al crear la consulta (verificable en logs/Notification table)
- [ ] `POST /api/admin/appointments/:id/cancel` funciona sin errores si el appointment no tiene Payment
- [ ] El webhook de Stripe sigue compilando y sus tests pasan
- [ ] CI verde (lint + typecheck + tests)

---

## 9. EDGE CASES

- **Appointments existentes `PENDING_PAYMENT`:** El webhook sigue funcionando para confirmarlos. No se migran.
- **Cancel sin Payment:** El endpoint de cancelación no debe lanzar error si `appointment.payment` es `null`. Solo cancela y notifica.
- **Notificación fallida:** Si `sendConsultationConfirmed` lanza excepción, el appointment ya fue creado. Loggear el error pero no hacer rollback del appointment (el email puede reintentar).
- **Doble submit:** Si el cliente hace doble submit, el segundo request puede fallar por conflicto de slot (lógica existente de disponibilidad — sin cambios).

---

## 10. TESTS REQUERIDOS

### Unitarios
- `createConsultation` → retorna appointment con `status: CONFIRMED`
- `createConsultation` → NO llama a `paymentService.createCheckoutSession`
- `createConsultation` → NO crea registro `Payment`

### Integración
- `POST /api/consultations` con datos válidos → 201 + `{ status: 'CONFIRMED' }` + NO `checkoutUrl`
- `POST /api/consultations` → Notification record creado (tipo `CONSULTATION_CONFIRMED`)
- `POST /api/admin/appointments/:id/cancel` en appointment sin Payment → cancela sin error 500

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `DATA-002` | Regla RB-003 | Marcar como DEPRECADA. Añadir RB-NEW-001 y RB-NEW-002 |
| `API-001` | `POST /api/consultations` | Actualizar respuesta: eliminar `checkoutUrl`, añadir `status: 'CONFIRMED'` |
| `BACK-001` | Flujo de booking — consulta | Actualizar diagrama/descripción del flujo sin Stripe |

---

## 12. DEPENDENCIAS

- Ninguna. Esta es la primera issue de la fase de cambios.

---

## 13. DEFINITION OF DONE

- [ ] Código implementado según scope
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] CI completamente verde
- [ ] `DATA-002` actualizado
- [ ] `API-001` actualizado
- [ ] `BACK-001` actualizado
- [ ] PR creado con descripción completa
- [ ] No hay referencias a `checkoutUrl` en el nuevo flujo de consulta
