# ISSUE DOC — #042 Admin: generar SessionLinks + API POST /api/admin/session-links

## 1. CONTEXTO

El flujo de reserva de tatuaje requiere que el admin genere un SessionLink tras una consulta completada. El link se envía al cliente y le permite seleccionar fecha y hora para su sesión de tatuaje. Sin SessionLink, el cliente no puede reservar (RB-005).

## 2. OBJETIVO

Implementar `POST /api/admin/session-links` para generar un SessionLink a partir de una consulta (Appointment tipo CONSULTATION) y mostrar la UI para copiarlo en el detalle del panel del dashboard.

## 3. SCOPE

- `POST /api/admin/session-links`: crea SessionLink para una consulta
- UI en WeeklyAgenda DetailPanel: botón "Generar SessionLink" en consultations CONFIRMED/COMPLETED
- Form inline: durationMinutes (required) + notes (optional)
- Muestra el link generado con botón "Copiar"
- AuditLog con acción `SESSION_LINK_GENERATED`
- Tests de integración del endpoint

## 4. ANTI-SCOPE

- Envío de email (issue #049)
- Validación/uso del SessionLink por el cliente
- Endpoint GET /api/admin/session-links
- Modificar el schema Prisma

## 5. ARCHIVOS AFECTADOS

- `issues-docs/042-admin-session-links.md` (nuevo)
- `src/app/api/admin/session-links/route.ts` (nuevo)
- `src/components/admin/weekly-agenda.tsx` (modificado — añadir SessionLink panel al DetailPanel)
- `tests/integration/admin/session-links.test.ts` (nuevo)

## 6. FLUJO DE EJECUCIÓN

1. Admin abre detalle de un Appointment tipo CONSULTATION en estado CONFIRMED o COMPLETED
2. Aparece botón "Generar SessionLink"
3. Admin completa form (durationMinutes, notes)
4. POST /api/admin/session-links → genera token aleatorio, guarda hash, retorna URL completa
5. UI muestra la URL con botón "Copiar"

## 7. REGLAS DE NEGOCIO

- RB-005: TattooSession solo se reserva mediante SessionLink válido
- RB-006: Un SessionLink solo puede usarse una vez
- Consultation debe existir, no estar eliminada (deletedAt null), y su status debe ser CONFIRMED o COMPLETED
- Consultation debe ser de type CONSULTATION
- durationMinutes: entero positivo (mínimo 30, máximo 480)
- expiresAt: 30 días desde la creación
- Token: 32 bytes aleatorios (hex), se guarda el SHA-256 hash

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] POST retorna 401 sin sesión admin
- [ ] POST retorna 400 si body inválido
- [ ] POST retorna 404 si consultation no existe
- [ ] POST retorna 409 si consultation no está en CONFIRMED/COMPLETED
- [ ] POST retorna 409 si ya existe un SessionLink para esa consultation
- [ ] POST retorna 200 con el link completo
- [ ] AuditLog creado con `SESSION_LINK_GENERATED`
- [ ] UI muestra botón solo en CONSULTATION CONFIRMED/COMPLETED
- [ ] UI muestra form y link generado copiable

## 9. EDGE CASES

- Consultation type TATTOO_SESSION → 409
- Consultation status PENDING_PAYMENT/CANCELLED/NO_SHOW → 409
- Consultation con SessionLink ya existente → 409 ALREADY_EXISTS
- durationMinutes = 0 o negativo → 400
- consultationId inexistente → 404

## 10. TESTS REQUERIDOS

- Integration: `tests/integration/admin/session-links.test.ts`
  - 401 sin auth
  - 400 body inválido (faltan campos, durationMinutes inválido)
  - 404 consultation no existe
  - 409 consultation tipo incorrecto
  - 409 consultation status incorrecto
  - 409 SessionLink ya existe
  - 200 crea SessionLink correctamente
  - 200 AuditLog creado con datos correctos

## 11. DEPENDENCIAS

- #037 — Admin login ✅
- #038 — WeeklyAgenda ✅

## 12. DEFINITION OF DONE

- [ ] Endpoint funciona según contrato API-001
- [ ] Tests de integración pasan
- [ ] CI verde
- [ ] PR creado
- [ ] Issue cerrada
