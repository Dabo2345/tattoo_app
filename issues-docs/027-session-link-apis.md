# ISSUE #027 — APIs SessionLink: GET /:token y POST /:token/book

---

# 1. CONTEXTO

Con el `SessionLinkService` listo (#026), esta issue expone los dos endpoints HTTP públicos del flujo de SessionLink: validar el enlace y reservar la TattooSession.

---

# 2. OBJETIVO

Crear dos route handlers:
1. `GET /api/session-links/:token` — valida el token y devuelve `{ valid, expiresAt, durationMinutes }`.
2. `POST /api/session-links/:token/book` — reserva la TattooSession: valida token, verifica disponibilidad, crea Appointment TATTOO_SESSION en CONFIRMED (sin pago, RB-004), marca el link como usado (RB-005).

---

# 3. ALCANCE (SCOPE)

- `src/app/api/session-links/[token]/route.ts` (nuevo)
- `src/app/api/session-links/[token]/book/route.ts` (nuevo)
- `bookingService.bookTattooSession(token, startsAt)` en `booking-service.ts`
- Métodos `findSessionLinkWithAppointment`, `markSessionLinkAsUsed`, `createTattooSession` en `booking-repository.ts`
- Tipos `BookSessionResult` en `booking/types/index.ts`
- `tests/integration/api/session-links.test.ts` (nuevo)

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No crear la página frontend (issue #036)
- No enviar notificaciones (issue #049)
- No crear SessionLink desde admin (issue #042)
- No pago — TattooSessions no requieren pago online (RB-004)

---

# 5. ARCHIVOS AFECTADOS

- `src/app/api/session-links/[token]/route.ts` (nuevo)
- `src/app/api/session-links/[token]/book/route.ts` (nuevo)
- `src/modules/booking/services/booking-service.ts` (+`bookTattooSession`)
- `src/modules/booking/repositories/booking-repository.ts` (+3 métodos)
- `src/modules/booking/types/index.ts` (+`BookSessionResult`)
- `tests/integration/api/session-links.test.ts` (nuevo)

---

# 6. FLUJO DE EJECUCIÓN

**GET /api/session-links/:token:**
1. Llamar `sessionLinkService.validateSessionLink(token)`
2. Devolver `{ valid: true, expiresAt, durationMinutes }`
3. `withErrorHandler` captura LinkNotFoundError/LinkExpiredError/LinkAlreadyUsedError → 410

**POST /api/session-links/:token/book:**
1. Validar body `{ startAt: ISO string }` con Zod
2. Llamar `bookingService.bookTattooSession(token, startsAt)`
   - Hashear token → buscar SessionLink con Appointment (clientId + durationMinutes)
   - Verificar expiración y usedAt (LinkExpiredError / LinkAlreadyUsedError)
   - Calcular endAt = startsAt + sessionDurationMinutes
   - Verificar disponibilidad (SlotNotAvailableError si ocupado)
   - Crear Appointment TATTOO_SESSION en CONFIRMED (RB-004: sin pago)
   - Marcar SessionLink como usado (usedAt = now, RB-005)
   - Audit log `TATTOO_SESSION_BOOKED`
3. Devolver `{ appointmentId }`

---

# 7. REGLAS DE NEGOCIO

- RB-004: TattooSessions no requieren pago online → status CONFIRMED al crear
- RB-005: SessionLink de un solo uso → marcar usedAt inmediatamente después de crear el appointment
- RB-012: No reservas solapadas → verificar disponibilidad con calendarService
- Duración del slot = `sessionLink.sessionDurationMinutes`
- El clientId se toma del Appointment original al que pertenece el SessionLink

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] GET devuelve 200 `{ valid: true, expiresAt, durationMinutes }` para token válido
- [ ] GET devuelve 410 para token expirado/inexistente/ya usado
- [ ] POST crea Appointment TATTOO_SESSION en CONFIRMED
- [ ] POST marca SessionLink con usedAt = now
- [ ] POST devuelve 409 si el slot ya está ocupado
- [ ] POST devuelve 410 si el token es inválido/expirado/ya usado
- [ ] POST devuelve 400 si el body es inválido
- [ ] Tests de integración pasan

---

# 9. CASOS EDGE

- Token inexistente → 410
- Token expirado → 410
- Token ya usado → 410
- Slot ocupado → 409 SLOT_NOT_AVAILABLE
- Body sin startAt → 400 VALIDATION_ERROR
- startAt inválido (no ISO) → 400 VALIDATION_ERROR

---

# 10. TESTS REQUERIDOS

**Integration tests** (`tests/integration/api/session-links.test.ts`):

GET /:token:
- 200 con datos del link para token válido
- 410 para token expirado/ya usado

POST /:token/book:
- 200 con appointmentId cuando booking exitoso
- 410 para token inválido
- 409 cuando slot no disponible
- 400 cuando body inválido

---

# 11. DEPENDENCIAS

- #026 — SessionLinkService ✅
- #013 — CalendarService ✅
- #015 — BookingService ✅

---

# 12. DEFINICIÓN DE DONE

- [ ] Dos route handlers creados
- [ ] `bookTattooSession` añadido a bookingService
- [ ] 3 métodos añadidos a booking-repository
- [ ] Tests de integración verdes
- [ ] `pnpm test` verde
- [ ] PR creado
