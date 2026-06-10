# ISSUE #024 — MagicLinkService: generación, almacenamiento y validación

---

# 1. CONTEXTO

El sistema permite a los clientes gestionar sus citas (ver, cancelar, reprogramar) sin tener cuenta registrada. El mecanismo es un MagicLink: un enlace con token seguro enviado al email del cliente. Esta issue implementa la capa de servicio y repositorio que genera, almacena y valida esos tokens.

Los endpoints HTTP de MagicLinks se crean en la issue #025. Esta issue solo cubre la lógica de negocio (service + repository).

---

# 2. OBJETIVO

Crear `MagicLinkService` con dos operaciones:
1. `createMagicLink(appointmentId)` — genera token, lo hashea y lo persiste en DB. Devuelve el token plano (para construir la URL).
2. `validateMagicLink(token)` — hashea el token entrante, busca en DB, valida expiración y devuelve el appointment con el cliente.

---

# 3. ALCANCE (SCOPE)

- `src/modules/booking/services/magic-link-service.ts` (nuevo)
- Método `createMagicLink` en `src/modules/booking/repositories/booking-repository.ts` (adición)
- Tipos `CreateMagicLinkResult` y `ValidateMagicLinkResult` en `src/modules/booking/types/index.ts`
- `tests/unit/modules/booking/magic-link-service.test.ts` (nuevo)

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No crear endpoints HTTP (issue #025)
- No enviar emails (issue #049, NotificationService)
- No crear SessionLinkService (issue #026)
- No modificar el schema Prisma
- No modificar la API de appointments existente

---

# 5. ARCHIVOS AFECTADOS

- `src/modules/booking/services/magic-link-service.ts` (nuevo)
- `src/modules/booking/repositories/booking-repository.ts` (añadir método)
- `src/modules/booking/types/index.ts` (añadir tipos)
- `tests/unit/modules/booking/magic-link-service.test.ts` (nuevo)

---

# 6. FLUJO DE EJECUCIÓN

1. Leer AUTH-001 §11, DATA-002 RB-007/RB-016, BACK-001 §13 (ya leídos)
2. Añadir tipos al módulo de booking
3. Añadir `createMagicLink` al booking-repository
4. Crear `magic-link-service.ts` con `createMagicLink` y `validateMagicLink`
5. Crear tests unitarios con mocks de repositorio y auditService
6. Ejecutar tests
7. Crear PR

---

# 7. REGLAS DE NEGOCIO

- RB-007: MagicLink expira en 2 horas desde su creación
- RB-016: toda cita confirmada genera un MagicLink
- El token plano (raw) se devuelve al caller para incluirlo en la URL
- Solo el hash SHA-256 se almacena en DB (nunca el token plano)
- Búsqueda siempre por hash, nunca por token plano
- MagicLink es multiuso mientras no haya expirado (no existe "usado")
- La expiración es el único mecanismo de invalidación
- Appointment inexistente → AppointmentNotFoundError
- Token no encontrado en DB → LinkNotFoundError
- Token expirado → LinkExpiredError

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] `createMagicLink` genera token, crea registro en DB con tokenHash y expiresAt=now+2h
- [ ] `createMagicLink` verifica que el appointment existe (lanza AppointmentNotFoundError si no)
- [ ] `createMagicLink` registra en AuditLog con acción `MAGIC_LINK_CREATED`
- [ ] `createMagicLink` devuelve el token plano (no el hash)
- [ ] `validateMagicLink` busca por hash del token
- [ ] `validateMagicLink` lanza `LinkNotFoundError` si el hash no existe
- [ ] `validateMagicLink` lanza `LinkExpiredError` si `expiresAt < now`
- [ ] `validateMagicLink` devuelve appointment con cliente si es válido
- [ ] Tests pasan con `pnpm test`

---

# 9. CASOS EDGE

- Appointment no existe al crear MagicLink → AppointmentNotFoundError
- Token inexistente en DB → LinkNotFoundError
- Token expirado exactamente en `expiresAt` → LinkExpiredError
- Mismo appointment puede tener múltiples MagicLinks (token rotado tras expiración)

---

# 10. TESTS REQUERIDOS

**Unit tests** (`tests/unit/modules/booking/magic-link-service.test.ts`):

`createMagicLink`:
- crea MagicLink con expiresAt = ahora + 2h y llama audit log
- devuelve el token plano (no el hash)
- lanza AppointmentNotFoundError si el appointment no existe

`validateMagicLink`:
- devuelve el appointment si el MagicLink es válido
- lanza LinkNotFoundError si el token no existe en DB
- lanza LinkExpiredError si el MagicLink ha expirado

---

# 11. DEPENDENCIAS

- #011 — API helpers (errores de dominio) ✅
- #022 — AuditService ✅
- #023 — Token utils (generateSecureToken, hashToken) ✅

---

# 12. DEFINICIÓN DE DONE

- [ ] `magic-link-service.ts` creado con `createMagicLink` y `validateMagicLink`
- [ ] `bookingRepository.createMagicLink` añadido
- [ ] Tipos añadidos en `booking/types/index.ts`
- [ ] Tests unitarios creados (mínimo 6 casos)
- [ ] `pnpm test` verde
- [ ] PR creado
