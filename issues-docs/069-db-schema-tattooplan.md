# ISSUE DOC #069 — DB: Modelos TattooPlan y TattooPlanSession

**Issue GitHub:** #069  
**Tipo:** feature  
**Epic:** EPIC 3 — Booking Core (extensión)  
**Rama:** `feature/069-db-schema-tattooplan`  
**Estado:** PENDIENTE  
**Fecha:** 2026-06-18  

---

## 1. CONTEXTO

Tras la consulta inicial con el cliente, el tatuador necesita documentar las características del tatuaje acordado (estilo, tamaño, placement, descripción) y planificar las sesiones necesarias (cuántas sesiones y cuántas horas cada una). Actualmente el sistema no tiene un modelo para esto: el `SessionLink` existente solo almacena duración de una sesión, sin contexto del tatuaje ni soporte para múltiples sesiones vinculadas a un plan.

Esta issue añade al schema de Prisma los modelos `TattooPlan` y `TattooPlanSession`.

---

## 2. OBJETIVO

Añadir al schema de Prisma dos nuevos modelos:

- **`TattooPlan`**: agrupa las características del tatuaje y está vinculado a una `Appointment` de tipo `CONSULTATION`.
- **`TattooPlanSession`**: representa cada sesión individual del plan, con su duración en minutos y su vínculo al `SessionLink` generado para ella.

Generar la migración Prisma correspondiente.

---

## 3. SCOPE

- Añadir enum `TattooPlanStatus` al schema
- Añadir enum `TattooPlanSessionStatus` al schema
- Añadir modelo `TattooPlan` con sus campos y relaciones
- Añadir modelo `TattooPlanSession` con sus campos y relaciones
- Añadir relación inversa en modelo `Appointment` (`tattooPlan TattooPlan?`)
- Añadir relación inversa en modelo `SessionLink` (`tattooPlanSession TattooPlanSession?`)
- Ejecutar `prisma migrate dev` con nombre de migración descriptivo
- Verificar que el cliente Prisma genera correctamente los tipos

---

## 4. ANTI-SCOPE

- NO implementar ningún servicio, repositorio ni API en esta issue
- NO modificar otros modelos existentes más allá de añadir las relaciones inversas indicadas
- NO añadir campos a `Appointment` o `SessionLink` más allá de las relaciones
- NO modificar enums existentes (`AppointmentStatus`, `AppointmentType`, etc.)

---

## 5. ARCHIVOS AFECTADOS

### Código
- `prisma/schema.prisma` — añadir enums y modelos, añadir relaciones inversas
- `prisma/migrations/[timestamp]_add_tattoo_plan/` — nueva migración generada

### Tests
- No hay tests de schema directamente, pero los tests existentes deben seguir pasando tras la migración

### Docs
- `docs/Documento 03 — DATA-001 — Modelo de Dominio y Base de Datos.md`

---

## 6. FLUJO DE EJECUCIÓN

1. Leer `prisma/schema.prisma` completo
2. Añadir enums al bloque de enums del schema:
   ```prisma
   enum TattooPlanStatus {
     DRAFT
     SENT
     IN_PROGRESS
     COMPLETED
   }

   enum TattooPlanSessionStatus {
     PENDING
     LINK_SENT
     BOOKED
     COMPLETED
   }
   ```
3. Añadir modelo `TattooPlan`:
   ```prisma
   model TattooPlan {
     id                        String           @id @default(cuid())
     consultationAppointmentId String           @unique
     style                     String
     size                      String
     placement                 String
     description               String
     notes                     String?
     status                    TattooPlanStatus @default(DRAFT)
     createdAt                 DateTime         @default(now())
     updatedAt                 DateTime         @updatedAt

     consultationAppointment   Appointment      @relation(fields: [consultationAppointmentId], references: [id])
     sessions                  TattooPlanSession[]
   }
   ```
4. Añadir modelo `TattooPlanSession`:
   ```prisma
   model TattooPlanSession {
     id              String                    @id @default(cuid())
     planId          String
     sessionNumber   Int
     durationMinutes Int
     sessionLinkId   String?                   @unique
     status          TattooPlanSessionStatus   @default(PENDING)
     createdAt       DateTime                  @default(now())
     updatedAt       DateTime                  @updatedAt

     plan            TattooPlan                @relation(fields: [planId], references: [id], onDelete: Cascade)
     sessionLink     SessionLink?              @relation(fields: [sessionLinkId], references: [id])

     @@unique([planId, sessionNumber])
   }
   ```
5. En el modelo `Appointment`, añadir la relación inversa:
   ```prisma
   tattooPlan TattooPlan?
   ```
6. En el modelo `SessionLink`, añadir la relación inversa:
   ```prisma
   tattooPlanSession TattooPlanSession?
   ```
7. Ejecutar: `npx prisma migrate dev --name add_tattoo_plan`
8. Verificar que no hay errores de migración
9. Ejecutar: `npx prisma generate`
10. Correr la suite de tests para verificar que nada se ha roto

---

## 7. REGLAS DE NEGOCIO

- Un `TattooPlan` pertenece a exactamente 1 `Appointment` de tipo `CONSULTATION` (`@unique`)
- Un `TattooPlan` puede tener 1 o más `TattooPlanSession`
- Cada `TattooPlanSession` tiene un `sessionNumber` único dentro del plan (`@@unique([planId, sessionNumber])`)
- El `sessionLinkId` en `TattooPlanSession` es `null` hasta que el admin genera el link para esa sesión
- Al eliminar un `TattooPlan`, sus `TattooPlanSession` se eliminan en cascada (`onDelete: Cascade`)
- Un `SessionLink` puede estar vinculado como máximo a 1 `TattooPlanSession` (`@unique`)

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] `prisma/schema.prisma` contiene `TattooPlan`, `TattooPlanSession`, `TattooPlanStatus`, `TattooPlanSessionStatus`
- [ ] `Appointment` tiene el campo `tattooPlan TattooPlan?`
- [ ] `SessionLink` tiene el campo `tattooPlanSession TattooPlanSession?`
- [ ] La migración corre sin errores en base de datos de desarrollo
- [ ] `npx prisma generate` no produce errores
- [ ] Los tests existentes siguen pasando tras la migración
- [ ] CI verde

---

## 9. EDGE CASES

- **Constraint `@@unique([planId, sessionNumber])`**: Garantiza que no pueden existir dos sesiones con el mismo número en el mismo plan. El servicio (issue #070) debe respetar esto.
- **`onDelete: Cascade` en TattooPlanSession**: Si se borra el plan, se borran las sesiones. Si una sesión tiene un `SessionLink` activo, ese link quedaría huérfano. La lógica de borrado del plan (issue #070) debe verificar que no haya SessionLinks usados antes de permitir borrar.
- **Migración en Supabase (producción)**: La migración es solo `CREATE TABLE` y `ALTER TABLE ADD COLUMN` — no destructiva. Segura para aplicar sin downtime.

---

## 10. TESTS REQUERIDOS

- Los tests existentes deben seguir pasando (prueba de no-regresión)
- No se requieren tests específicos de schema — los tests de servicio (issue #070) cubrirán los modelos

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `DATA-001` | Diagrama de entidades / Modelos | Añadir `TattooPlan` y `TattooPlanSession` con sus campos, relaciones y enums |

---

## 12. DEPENDENCIAS

- **#067** — no es estrictamente necesaria, pero pertenece a la misma fase de cambios. Se recomienda merge de #067 y #068 antes de empezar FASE 2.

---

## 13. DEFINITION OF DONE

- [ ] Schema actualizado con los dos nuevos modelos y enums
- [ ] Migración generada y aplicada correctamente
- [ ] `prisma generate` limpio
- [ ] Tests existentes siguen pasando
- [ ] CI verde
- [ ] `DATA-001` actualizado con los nuevos modelos
- [ ] PR creado con descripción completa
