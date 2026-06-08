# ISSUE #025 — APIs MagicLink: POST /request y GET /:token

---

# 1. CONTEXTO

Con el `MagicLinkService` listo (#024), esta issue expone los dos endpoints HTTP que permiten a los clientes obtener y usar un MagicLink para gestionar su cita sin cuenta registrada.

---

# 2. OBJETIVO

Crear dos route handlers:
1. `POST /api/magic-links/request` — recibe `{ email }`, crea un MagicLink para la cita CONFIRMED más reciente del cliente, devuelve siempre `{ success: true }` (seguridad: no revelar si el email existe).
2. `GET /api/magic-links/:token` — valida el token y devuelve los datos de la cita, o 410 si expiró.

---

# 3. ALCANCE (SCOPE)

- `src/app/api/magic-links/request/route.ts` (nuevo)
- `src/app/api/magic-links/[token]/route.ts` (nuevo)
- `src/modules/booking/repositories/client-repository.ts` — añadir `findByEmail`
- `src/modules/booking/repositories/booking-repository.ts` — añadir `findLatestConfirmedAppointmentByClientId`
- `tests/integration/api/magic-links.test.ts` (nuevo)

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No enviar email (issue #049)
- No crear página frontend (issue #035)
- No modificar MagicLinkService
- No rate limiting (issue #056)

---

# 5. ARCHIVOS AFECTADOS

- `src/app/api/magic-links/request/route.ts` (nuevo)
- `src/app/api/magic-links/[token]/route.ts` (nuevo)
- `src/modules/booking/repositories/client-repository.ts` (+1 método)
- `src/modules/booking/repositories/booking-repository.ts` (+1 método)
- `tests/integration/api/magic-links.test.ts` (nuevo)

---

# 6. FLUJO DE EJECUCIÓN

**POST /api/magic-links/request:**
1. Validar body `{ email: string }` con Zod
2. Buscar cliente por email — si no existe, devolver `{ success: true }` sin error
3. Buscar cita CONFIRMED más reciente del cliente — si no existe, devolver `{ success: true }`
4. Crear MagicLink via `magicLinkService.createMagicLink(appointmentId)`
5. (Email se envía en #049 — fuera de scope)
6. Devolver `{ success: true }`

**GET /api/magic-links/:token:**
1. Extraer `token` de los params de la URL
2. Llamar `magicLinkService.validateMagicLink(token)`
3. Devolver `{ success: true, data: { appointment } }` en caso válido
4. `withErrorHandler` captura `LinkNotFoundError` → 410, `LinkExpiredError` → 410

---

# 7. REGLAS DE NEGOCIO

- POST siempre retorna `{ success: true }` aunque el email no exista (seguridad: no revelar datos)
- GET retorna 410 con `LINK_EXPIRED` si el token expiró o no existe
- MagicLink es multiuso mientras no haya expirado (no existe "consumido")
- Solo se crea MagicLink para citas en estado CONFIRMED

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] POST devuelve 200 `{ success: true }` si email válido con cita CONFIRMED
- [ ] POST devuelve 200 `{ success: true }` si email no existe (sin error)
- [ ] POST devuelve 200 `{ success: true }` si email existe pero sin cita CONFIRMED
- [ ] POST devuelve 400 si body inválido (sin email)
- [ ] GET devuelve 200 con datos de cita si token válido
- [ ] GET devuelve 410 `LINK_EXPIRED` si token expirado
- [ ] GET devuelve 410 `LINK_EXPIRED` si token no existe
- [ ] Tests de integración pasan

---

# 9. CASOS EDGE

- Email no registrado → 200 `{ success: true }` (sin crear MagicLink)
- Email registrado sin cita CONFIRMED → 200 `{ success: true }`
- Token válido → 200 con appointment + client
- Token expirado → 410 LINK_EXPIRED
- Token inexistente → 410 LINK_EXPIRED (LinkNotFoundError mapeado igual)
- Body sin email → 400 VALIDATION_ERROR

---

# 10. TESTS REQUERIDOS

**Integration tests** (`tests/integration/api/magic-links.test.ts`):

POST /api/magic-links/request:
- devuelve 200 `{ success: true }` cuando crea MagicLink exitosamente
- devuelve 200 `{ success: true }` cuando el email no existe
- devuelve 200 `{ success: true }` cuando no hay cita CONFIRMED
- devuelve 400 cuando falta el campo email

GET /api/magic-links/:token:
- devuelve 200 con datos del appointment para token válido
- devuelve 410 LINK_EXPIRED para token expirado
- devuelve 410 LINK_EXPIRED para token inexistente

---

# 11. DEPENDENCIAS

- #024 — MagicLinkService ✅
- #011 — API helpers ✅

---

# 12. DEFINICIÓN DE DONE

- [ ] Dos route handlers creados
- [ ] Dos métodos de repositorio añadidos
- [ ] Tests de integración creados y verdes
- [ ] `pnpm test` verde
- [ ] PR creado
