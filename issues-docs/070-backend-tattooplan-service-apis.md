# ISSUE DOC #070 — Backend: TattooPlanService y APIs admin

**Issue GitHub:** #070  
**Tipo:** feature  
**Epic:** EPIC 6 — Admin  
**Rama:** `feature/070-backend-tattooplan-service-apis`  
**Estado:** PENDIENTE  
**Fecha:** 2026-06-18  

---

## 1. CONTEXTO

Con los modelos `TattooPlan` y `TattooPlanSession` ya en base de datos (#069), se necesita la capa de servicio y los endpoints de API que permitan al administrador:

1. Crear un plan de tatuaje vinculado a una consulta confirmada
2. Consultar el plan existente de una cita
3. Enviar el plan al cliente (genera `SessionLink` por cada sesión + dispara email)

---

## 2. OBJETIVO

Implementar `TattooPlanService`, `TattooPlanRepository` y los siguientes endpoints de API admin:

- `POST /api/admin/appointments/:id/tattoo-plan` — crear plan (estado DRAFT)
- `GET /api/admin/appointments/:id/tattoo-plan` — obtener plan con sus sesiones
- `POST /api/admin/tattoo-plans/:planId/send` — enviar al cliente (genera links + email)

---

## 3. SCOPE

- `src/modules/booking/repositories/tattoo-plan-repository.ts` — CRUD de TattooPlan y TattooPlanSession
- `src/modules/booking/services/tattoo-plan-service.ts` — lógica de negocio
- `src/modules/booking/schemas/tattoo-plan-schema.ts` — validación Zod de inputs
- `src/modules/booking/types/tattoo-plan.ts` — tipos TypeScript
- `src/app/api/admin/appointments/[id]/tattoo-plan/route.ts` — GET + POST
- `src/app/api/admin/tattoo-plans/[planId]/send/route.ts` — POST (envío)
- Llamada a `NotificationService.sendTattooPlan` (stub: el método real se implementa en #073; en esta issue solo se define la interfaz y se deja un `// TODO: #073`)

---

## 4. ANTI-SCOPE

- NO implementar el template de email (eso es #073)
- NO modificar el schema de Prisma (ya hecho en #069)
- NO implementar la UI admin (eso es #072)
- NO modificar el endpoint de disponibilidad (eso es #071)
- NO añadir endpoints públicos (sin autenticación)

---

## 5. ARCHIVOS AFECTADOS

### Código nuevo
- `src/modules/booking/repositories/tattoo-plan-repository.ts`
- `src/modules/booking/services/tattoo-plan-service.ts`
- `src/modules/booking/schemas/tattoo-plan-schema.ts`
- `src/modules/booking/types/tattoo-plan.ts`
- `src/app/api/admin/appointments/[id]/tattoo-plan/route.ts`
- `src/app/api/admin/tattoo-plans/[planId]/send/route.ts`

### Tests
- `tests/unit/tattoo-plan-service.test.ts` — nuevo
- `tests/integration/tattoo-plan-api.test.ts` — nuevo

### Docs
- `docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md`
- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md`

---

## 6. FLUJO DE EJECUCIÓN

1. Leer `src/modules/booking/services/session-link-service.ts` para entender el patrón existente de creación de SessionLinks
2. Leer `src/modules/booking/repositories/booking-repository.ts` para seguir el patrón de repositorio
3. Leer `src/modules/notification/services/notification-service.ts` para entender cómo añadir un nuevo método
4. Crear tipos en `tattoo-plan.ts`:
   ```typescript
   export interface CreateTattooPlanInput {
     style: string
     size: string
     placement: string
     description: string
     notes?: string
     sessions: Array<{ sessionNumber: number; durationMinutes: number }>
   }
   export interface TattooPlanWithSessions // incluye plan + sessions + sessionLink info
   ```
5. Crear schemas Zod en `tattoo-plan-schema.ts`:
   - `createTattooPlanSchema`: validar todos los campos, `sessions` array con min 1 elemento, `durationMinutes` entre 30 y 600 (en múltiplos de 30)
6. Crear `TattooPlanRepository`:
   - `create(consultationAppointmentId, input)` — crea plan + sesiones en transacción
   - `findByAppointmentId(appointmentId)` — plan con sesiones y sessionLinks
   - `findById(planId)` — plan con sesiones
   - `updateSessionLinkId(sessionId, sessionLinkId)` — al crear SessionLink para una sesión
   - `updatePlanStatus(planId, status)` — DRAFT → SENT, etc.
7. Crear `TattooPlanService`:
   - `createPlan(appointmentId, input)`:
     - Verificar que appointment existe y es tipo `CONSULTATION` y status `CONFIRMED`
     - Verificar que no existe ya un plan para esa cita
     - Llamar a repository.create
   - `getPlanByAppointmentId(appointmentId)` — llamar a repository
   - `sendPlanToClient(planId)`:
     - Verificar que plan existe y está en DRAFT
     - Para cada `TattooPlanSession`:
       - Llamar a `SessionLinkService.createSessionLink(consultationAppointmentId, durationMinutes)` — **NOTA**: revisar si el SessionLink ya soporta el `appointmentId` correcto; el tattoo session link debe vincularse a la CONSULTA o a un nuevo appointment. Ver nota en Edge Cases.
       - Actualizar `TattooPlanSession.sessionLinkId`
       - Actualizar `TattooPlanSession.status = LINK_SENT`
     - Actualizar `TattooPlan.status = SENT`
     - Llamar a `notificationService.sendTattooPlan(planId)` — stub por ahora (TODO: #073)
     - Log en AuditLog: acción `TATTOO_PLAN_SENT`
8. Crear API routes:
   - `GET /api/admin/appointments/:id/tattoo-plan` — autenticado (admin), llama a `tattooPlanService.getPlanByAppointmentId`
   - `POST /api/admin/appointments/:id/tattoo-plan` — autenticado (admin), valida body con Zod, llama a `tattooPlanService.createPlan`
   - `POST /api/admin/tattoo-plans/:planId/send` — autenticado (admin), llama a `tattooPlanService.sendPlanToClient`
9. Escribir tests
10. Actualizar docs

---

## 7. REGLAS DE NEGOCIO

- **RB-TP-001:** Solo se puede crear un `TattooPlan` para una appointment en estado `CONFIRMED` y tipo `CONSULTATION`.
- **RB-TP-002:** Solo puede existir un `TattooPlan` por appointment (constraint `@unique` en DB).
- **RB-TP-003:** El plan solo puede enviarse si está en estado `DRAFT`.
- **RB-TP-004:** Al enviar el plan, se crea un `SessionLink` por cada `TattooPlanSession`. Cada SessionLink expira en 30 días (comportamiento existente de `SessionLinkService`).
- **RB-TP-005:** Un plan con status `SENT` ya no puede modificarse (solo lectura).
- **RB-TP-006:** `durationMinutes` debe ser múltiplo de 30 (porque los slots son de 30 min) y entre 30 y 600 minutos (máximo 10 horas por sesión).
- **RB-TP-007:** El número de sesiones debe ser entre 1 y 10.
- **RB-TP-008:** Cada acción de envío se registra en AuditLog con acción `TATTOO_PLAN_SENT`.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] `POST /api/admin/appointments/:id/tattoo-plan` con datos válidos → 201 + plan creado en DRAFT
- [ ] `POST /api/admin/appointments/:id/tattoo-plan` en appointment no CONFIRMED → 422 con error descriptivo
- [ ] `POST /api/admin/appointments/:id/tattoo-plan` cuando ya existe plan → 409 Conflict
- [ ] `GET /api/admin/appointments/:id/tattoo-plan` → 200 + plan con sesiones
- [ ] `GET /api/admin/appointments/:id/tattoo-plan` cuando no existe → 404
- [ ] `POST /api/admin/tattoo-plans/:planId/send` → 200 + plan en SENT, SessionLinks creados por cada sesión
- [ ] `POST /api/admin/tattoo-plans/:planId/send` en plan ya SENT → 422 con error
- [ ] Todos los endpoints requieren sesión admin (401 si no autenticado)
- [ ] AuditLog registra `TATTOO_PLAN_SENT`
- [ ] CI verde

---

## 9. EDGE CASES

- **SessionLink y `appointmentId`:** El `SessionLink` existente se asocia a un `appointmentId`. Al crear los links del plan, la appointment asociada es la CONSULTA original. Cuando el cliente use el link para reservar, `BookingService.bookTattooSession` creará un NUEVO appointment de tipo `TATTOO_SESSION` vinculado al cliente. Verificar que el flujo existente de `session-link-service.ts` sigue funcionando con este uso.
- **Fallo parcial en `sendPlanToClient`:** Si falla la creación del SessionLink para la sesión 2 de 3, las sesiones 1 y 2 ya tienen links creados. Envolver en transacción Prisma o implementar rollback. Registrar error detallado en logs.
- **Plan con 1 sola sesión:** Debe funcionar igual. Caso más simple.
- **Re-envío:** Si el admin intenta enviar un plan ya enviado (SENT), devolver error 422 claro. No crear SessionLinks duplicados.

---

## 10. TESTS REQUERIDOS

### Unitarios (`tattoo-plan-service.test.ts`)
- `createPlan` con appointment CONFIRMED → crea plan en DRAFT
- `createPlan` con appointment PENDING_PAYMENT → lanza error
- `createPlan` cuando ya existe plan → lanza error de duplicado
- `sendPlanToClient` en plan DRAFT → crea SessionLinks y actualiza status a SENT
- `sendPlanToClient` en plan SENT → lanza error
- `sendPlanToClient` — por cada sesión se crea un SessionLink

### Integración (`tattoo-plan-api.test.ts`)
- `POST /api/admin/appointments/:id/tattoo-plan` → 201 + datos correctos
- `GET /api/admin/appointments/:id/tattoo-plan` → 200 + plan con sesiones
- `POST /api/admin/tattoo-plans/:planId/send` → 200 + SessionLinks creados
- Requests sin autenticación → 401

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `API-001` | Endpoints admin | Añadir los 3 nuevos endpoints con request/response schemas |
| `BACK-001` | Módulo booking / flujo tattoo session | Añadir `TattooPlanService` y flujo de creación de plan |

---

## 12. DEPENDENCIAS

- **#069 debe estar MERGEADA** — los modelos Prisma deben existir antes de implementar el servicio.

---

## 13. DEFINITION OF DONE

- [ ] `TattooPlanRepository`, `TattooPlanService`, schemas y tipos implementados
- [ ] 3 API routes implementadas y protegidas con auth admin
- [ ] Tests unitarios pasan (cobertura >80% del servicio)
- [ ] Tests de integración pasan
- [ ] CI completamente verde
- [ ] `API-001` actualizado con nuevos endpoints
- [ ] `BACK-001` actualizado con nuevo servicio
- [ ] PR creado con descripción completa
