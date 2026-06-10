# ISSUE #023 — Token utils: generación segura con crypto y hashing SHA-256

---

# 1. CONTEXTO

El sistema necesita generar tokens seguros para MagicLinks (gestión de citas sin cuenta) y SessionLinks (reserva de sesión de tatuaje). Ambos tokens deben ser criptográficamente seguros, impredecibles y almacenarse únicamente como hash en la base de datos, nunca en texto plano.

Esta issue crea la utilidad base que serán usadas por `#024 MagicLinkService` y `#026 SessionLinkService`.

---

# 2. OBJETIVO

Crear `/src/lib/utils/tokens.ts` con dos funciones exportadas:

- `generateSecureToken()` — genera un token de 32 bytes aleatorios en formato hex (64 chars)
- `hashToken(token: string)` — retorna el hash SHA-256 del token en hex

---

# 3. ALCANCE (SCOPE)

- Crear `/src/lib/utils/tokens.ts` con las dos funciones
- Crear `/tests/unit/lib/utils/tokens.test.ts` con tests unitarios completos

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No crear MagicLinkService ni SessionLinkService
- No modificar base de datos ni Prisma schema
- No modificar APIs existentes
- No crear índices ni exports adicionales en otros archivos

---

# 5. ARCHIVOS AFECTADOS

- `src/lib/utils/tokens.ts` (nuevo)
- `tests/unit/lib/utils/tokens.test.ts` (nuevo)

---

# 6. FLUJO DE EJECUCIÓN

1. Leer AUTH-001 §11-13 y BACK-001 §13 (ya leídos)
2. Crear `src/lib/utils/tokens.ts` usando Node.js `crypto` built-in
3. Crear tests unitarios cubriendo: generación, formato, unicidad y hashing
4. Ejecutar tests localmente
5. Crear PR

---

# 7. REGLAS DE NEGOCIO

- Tokens generados con `crypto.randomBytes(32).toString("hex")` → 64 caracteres hex
- Hash con `crypto.createHash("sha256").update(token).digest("hex")`
- El token original se envía al cliente (en URL)
- Solo el hash se almacena en la base de datos
- La búsqueda siempre es por hash, nunca por token original
- MagicLinks expiran en 2 horas (responsabilidad del servicio que los usa, no de esta util)
- SessionLinks expiran en 30 días (responsabilidad del servicio que los usa)

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] `generateSecureToken()` retorna string hex de 64 caracteres
- [ ] `generateSecureToken()` usa `crypto.randomBytes(32)`
- [ ] Dos llamadas consecutivas producen tokens distintos
- [ ] `hashToken(token)` retorna string hex de 64 caracteres (SHA-256)
- [ ] `hashToken(token)` es determinista: mismo input → mismo output
- [ ] `hashToken(token)` produce outputs distintos para inputs distintos
- [ ] Tests pasan con `pnpm test`
- [ ] No se introduce ninguna dependencia externa

---

# 9. CASOS EDGE

- Tokens distintos en cada llamada (entropía suficiente)
- Hash determinista para el mismo token
- Hash diferente para tokens distintos
- Función pura: no tiene efectos secundarios

---

# 10. TESTS REQUERIDOS

**Unit tests** (`tests/unit/lib/utils/tokens.test.ts`):
- `generateSecureToken` retorna string de longitud 64
- `generateSecureToken` retorna solo caracteres hex `[0-9a-f]`
- `generateSecureToken` produce tokens únicos en llamadas sucesivas
- `hashToken` retorna string de longitud 64
- `hashToken` retorna solo caracteres hex
- `hashToken` es determinista
- `hashToken` produce hashes distintos para tokens distintos
- El hash de un token generado no es igual al token original

---

# 11. DEPENDENCIAS

- #011 — API helpers (completo ✅)
- #022 — AuditService (completo ✅)

---

# 12. DEFINICIÓN DE DONE

- [x] `src/lib/utils/tokens.ts` creado
- [x] `tests/unit/lib/utils/tokens.test.ts` creado
- [ ] `pnpm test` verde
- [ ] PR creado con descripción completa
- [ ] CI verde
