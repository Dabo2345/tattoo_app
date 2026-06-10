# ISSUE #026 — SessionLinkService: generación, almacenamiento y validación

---

# 1. CONTEXTO

El SessionLink es el mecanismo por el cual el admin envía al cliente un enlace para reservar su TattooSession. A diferencia del MagicLink (multiuso, 2h), el SessionLink es de **un solo uso** y expira en **30 días**. Esta issue implementa la capa de servicio y repositorio del ciclo de vida del SessionLink.

Los endpoints HTTP se crean en #027. Esta issue solo cubre la lógica de negocio.

---

# 2. OBJETIVO

Crear `SessionLinkService` con dos operaciones:
1. `createSessionLink(data)` — genera token seguro, hashea, persiste en DB con TTL 30 días, devuelve token plano.
2. `validateSessionLink(token)` — hashea el token entrante, busca en DB, verifica expiración y uso previo, devuelve datos del link.

---

# 3. ALCANCE (SCOPE)

- `src/modules/booking/services/session-link-service.ts` (nuevo)
- Métodos `createSessionLink` y `findSessionLinkByHash` en `booking-repository.ts`
- Tipos `CreateSessionLinkInput`, `CreateSessionLinkResult`, `ValidateSessionLinkResult` en `booking/types/index.ts`
- `tests/unit/modules/booking/session-link-service.test.ts` (nuevo)

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No crear endpoints HTTP (issue #027)
- No marcar SessionLink como usado (issue #027, en el flow de booking)
- No crear MagicLinkService (ya en #024)
- No modificar schema Prisma

---

# 5. ARCHIVOS AFECTADOS

- `src/modules/booking/services/session-link-service.ts` (nuevo)
- `src/modules/booking/repositories/booking-repository.ts` (+2 métodos)
- `src/modules/booking/types/index.ts` (+3 interfaces)
- `tests/unit/modules/booking/session-link-service.test.ts` (nuevo)

---

# 6. FLUJO DE EJECUCIÓN

**createSessionLink:**
1. Verificar que el appointment existe (AppointmentNotFoundError si no)
2. Generar token con `generateSecureToken()`
3. Hashear con `hashToken()`
4. Persistir `{ appointmentId, tokenHash, expiresAt: now+30d, sessionDurationMinutes, artistNotes }`
5. Loguear `SESSION_LINK_CREATED` en AuditService
6. Devolver token plano + expiresAt

**validateSessionLink:**
1. Hashear el token entrante
2. Buscar por hash en DB — LinkNotFoundError si no existe
3. Si `expiresAt < now` → LinkExpiredError
4. Si `usedAt != null` → LinkAlreadyUsedError
5. Devolver datos del link (expiresAt, sessionDurationMinutes, artistNotes)

---

# 7. REGLAS DE NEGOCIO

- AUTH-001 §12: SessionLink expira en 30 días
- RB-004: TattooSession solo puede reservarse via SessionLink válido
- RB-005: SessionLink de un solo uso (`usedAt` marca si fue consumido)
- Solo el hash se almacena en DB (nunca token plano)
- Un appointment solo puede tener un SessionLink (`appointmentId @unique` en schema)

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] `createSessionLink` genera token, persiste hash+TTL 30d, devuelve token plano
- [ ] `createSessionLink` verifica que appointment existe
- [ ] `createSessionLink` registra en AuditLog `SESSION_LINK_CREATED`
- [ ] `validateSessionLink` lanza `LinkNotFoundError` si hash no existe
- [ ] `validateSessionLink` lanza `LinkExpiredError` si expiresAt < now
- [ ] `validateSessionLink` lanza `LinkAlreadyUsedError` si usedAt != null
- [ ] `validateSessionLink` devuelve datos del link si es válido
- [ ] Tests pasan con `pnpm test`

---

# 9. CASOS EDGE

- Appointment no existe → AppointmentNotFoundError al crear
- Token no existe en DB → LinkNotFoundError
- Token expirado → LinkExpiredError
- Token ya usado (usedAt != null) → LinkAlreadyUsedError
- Token válido → datos del link

---

# 10. TESTS REQUERIDOS

**Unit tests** (`tests/unit/modules/booking/session-link-service.test.ts`):

`createSessionLink`:
- devuelve token plano (hex64) y expiresAt ≈ +30 días
- almacena hash (no token plano) en DB
- lanza AppointmentNotFoundError si appointment no existe
- registra SESSION_LINK_CREATED en audit

`validateSessionLink`:
- devuelve datos del link para token válido
- lanza LinkNotFoundError si token no existe
- lanza LinkExpiredError si expirado
- lanza LinkAlreadyUsedError si ya fue usado

---

# 11. DEPENDENCIAS

- #023 — Token utils ✅
- #022 — AuditService ✅
- #011 — API helpers (errores de dominio) ✅

---

# 12. DEFINICIÓN DE DONE

- [ ] `session-link-service.ts` creado
- [ ] 2 métodos añadidos a booking-repository
- [ ] 3 tipos añadidos a booking/types
- [ ] Tests unitarios verdes
- [ ] `pnpm test` verde (suite completa)
- [ ] PR creado
