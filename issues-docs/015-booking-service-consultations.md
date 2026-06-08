# ISSUE DOC — #015: BookingService: crear Consultation con estado PENDING_PAYMENT

**Rama:** `feature/015-booking-service`
**Dependencias:** #013 (CalendarService) ✅

---

## 1. CONTEXTO

El flujo de reserva comienza cuando un cliente público selecciona un slot y rellena el formulario. El `BookingService` es la capa de negocio que orquesta: verificar que el slot esté libre, persistir o recuperar el `Client`, crear el `Appointment` en estado `PENDING_PAYMENT` y registrar la acción en `AuditLog`. El pago Stripe y la generación de MagicLink se gestionan en issues posteriores (#017, #024).

---

## 2. OBJETIVO

Implementar `BookingService.createConsultation()` con su repositorio y schema Zod. La función debe ser determinista, testeable en aislamiento y exponer un resultado tipado que las capas superiores (#016 API, #017 Stripe) puedan consumir.

---

## 3. SCOPE

- `src/modules/booking/types/index.ts`
- `src/modules/booking/schemas/create-consultation.schema.ts`
- `src/modules/booking/repositories/client-repository.ts`
- `src/modules/booking/repositories/booking-repository.ts`
- `src/modules/booking/services/booking-service.ts`
- `tests/unit/modules/booking/booking-service.test.ts`

---

## 4. ANTI-SCOPE

- API endpoint `POST /api/consultations` → issue #016
- Stripe Checkout Session → issue #017
- `depositAmount` en el Appointment → issue #017 (Stripe provee el monto)
- `MagicLink` → issue #024
- `AuditService` independiente → issue #022 (aquí escritura directa vía repositorio)
- Notificaciones → issue #046+
- Manejo de conflicto de `phone` único entre clientes distintos → fuera de scope

---

## 5. ARCHIVOS AFECTADOS

| Archivo | Acción |
|---------|--------|
| `src/modules/booking/types/index.ts` | CREAR |
| `src/modules/booking/schemas/create-consultation.schema.ts` | CREAR |
| `src/modules/booking/repositories/client-repository.ts` | CREAR |
| `src/modules/booking/repositories/booking-repository.ts` | CREAR |
| `src/modules/booking/services/booking-service.ts` | CREAR |
| `tests/unit/modules/booking/booking-service.test.ts` | CREAR |

---

## 6. FLUJO DE EJECUCIÓN

```
bookingService.createConsultation(input)
  │
  ├─ 1. calendarService.assertSlotAvailable(startsAt, endsAt)
  │       → lanza SlotNotAvailableError si el slot no está libre (RB-012)
  │
  ├─ 2. clientRepository.findOrCreate({ name, email, phone })
  │       → upsert por email: si existe, devuelve el existente (RB-001)
  │       → si no existe, crea uno nuevo
  │
  ├─ 3. bookingRepository.createConsultation({ clientId, startsAt, endsAt, notes })
  │       → crea Appointment con type=CONSULTATION, status=PENDING_PAYMENT (RB-002, RB-003)
  │       → depositRequired=true, depositAmount=null (pendiente Stripe #017)
  │
  ├─ 4. bookingRepository.createAuditLog({ action: "CONSULTATION_CREATED", ... })
  │       → registra entityId=appointment.id, entityType="Appointment" (RB-020)
  │
  └─ 5. return { appointmentId, clientId }
```

---

## 7. REGLAS DE NEGOCIO

| Regla | Descripción |
|-------|-------------|
| RB-001 | Clientes sin cuenta; identificados por email + phone |
| RB-002 | Toda consulta requiere depósito (depositRequired=true) |
| RB-003 | Sin pago confirmado → Appointment permanece en PENDING_PAYMENT |
| RB-012 | No se permiten solapamientos; CalendarService.assertSlotAvailable lanza error si hay conflicto |
| RB-020 | Toda acción del sistema se registra en AuditLog |

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] Si `assertSlotAvailable` lanza `SlotNotAvailableError` → el servicio propaga el error sin crear nada
- [ ] Si el email ya existe en `clients` → se usa el `Client` existente (no se crea uno nuevo)
- [ ] Si el email no existe → se crea un `Client` nuevo
- [ ] `Appointment` creado tiene `type=CONSULTATION`, `status=PENDING_PAYMENT`, `depositRequired=true`
- [ ] `AuditLog` creado tiene `action="CONSULTATION_CREATED"`, `entityType="Appointment"`, `entityId=appointment.id`
- [ ] El resultado devuelto incluye `appointmentId` y `clientId`
- [ ] Tests pasan en CI

---

## 9. EDGE CASES

- **Slot ocupado:** `assertSlotAvailable` lanza `SlotNotAvailableError` → ni Client ni Appointment se crean
- **Email duplicado:** `findOrCreate` con upsert devuelve el cliente existente silenciosamente
- **startsAt >= endsAt:** el schema Zod rechaza la entrada antes de llegar al servicio

---

## 10. TESTS REQUERIDOS

**Unit tests** (`tests/unit/modules/booking/booking-service.test.ts`):

| Test | Descripción |
|------|-------------|
| slot libre + cliente nuevo | Crea Client + Appointment + AuditLog |
| slot libre + cliente existente | Reutiliza Client existente |
| slot ocupado | Lanza SlotNotAvailableError, no crea nada |
| resultado correcto | Devuelve `{ appointmentId, clientId }` con los IDs correctos |
| auditlog correcto | AuditLog tiene action, entityId, entityType, clientId |

---

## 11. DEPENDENCIAS

| Issue | Estado |
|-------|--------|
| #013 CalendarService | ✅ Completada |
| #014 API availability | ✅ Completada |

---

## 12. DEFINITION OF DONE

- [ ] `bookingService.createConsultation()` implementado
- [ ] `clientRepository` con `findOrCreate`
- [ ] `bookingRepository` con `createConsultation` y `createAuditLog`
- [ ] Schema Zod con validación `endsAt > startsAt`
- [ ] Todos los tests pasan localmente
- [ ] CI verde
- [ ] PR creado apuntando a `develop`
