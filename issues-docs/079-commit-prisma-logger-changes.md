# ISSUE DOC #079 — Fix: commitar cambios locales en prisma/schema.prisma y src/lib/logger.ts

**Issue GitHub:** #153
**Tipo:** bugfix
**Prioridad:** P1: High
**Rama:** `fix/079-commit-prisma-logger`
**Estado:** PENDIENTE
**Fecha:** 2026-09-02

---

## 1. CONTEXTO

Hay dos archivos con cambios funcionales importantes que existen en el working tree local pero nunca fueron commiteados a develop. Están en estado modificado sin trackear en git.

Adicionalmente existe una migración Prisma no commiteada (`20260612234333_initial_schema`) que necesita revisión antes de incluirse.

---

## 2. OBJETIVO

Commitear los dos cambios funcionales a develop para que el repositorio refleje el estado real del código.

---

## 3. SCOPE

1. **`prisma/schema.prisma`** — añadir `url` y `directUrl` al datasource (necesario para Supabase connection pooling)
2. **`src/lib/logger.ts`** — añadir `serializers` para objetos Error (fix para crash de pino-pretty worker en Node.js/Windows)

---

## 4. ANTI-SCOPE

- NO commitear `prisma/migrations/20260612234333_initial_schema/` hasta que se analice si es válida o accidental
- NO modificar ninguna otra lógica

---

## 5. ARCHIVOS AFECTADOS

- `prisma/schema.prisma`
- `src/lib/logger.ts`

---

## 6. ROOT CAUSE

### prisma/schema.prisma
Supabase requiere dos URLs distintas:
- `url` → conexión a través del connection pooler (para queries en runtime)
- `directUrl` → conexión directa sin pooler (para migraciones Prisma)

Sin `directUrl`, `prisma migrate` falla en entornos con pooling (Supabase).

### src/lib/logger.ts
En Node.js, pino-pretty corre en un worker thread separado. Pasar un objeto `Error` nativo via `postMessage` al worker lanza una excepción porque `Error` no es transferible entre contextos de thread. Los `serializers` convierten el Error a JSON plano antes del postMessage, evitando el crash.

---

## 7. FLUJO DE EJECUCIÓN

1. Crear rama `fix/079-commit-prisma-logger`
2. Stage `prisma/schema.prisma` y `src/lib/logger.ts`
3. Commit con mensaje convencional
4. Push y crear PR
5. Verificar CI verde
6. Merge a develop

---

## 8. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `ENV-001` | Variables de entorno | Verificar que `DIRECT_URL` esté documentada |

---

## 9. DEFINITION OF DONE

- [ ] `prisma/schema.prisma` commiteado con `url` y `directUrl`
- [ ] `src/lib/logger.ts` commiteado con serializers
- [ ] CI verde
- [ ] PR mergeado a develop
