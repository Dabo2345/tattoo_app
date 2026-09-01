# ISSUE DOC #079 — Fix: commitar cambios locales en src/lib/logger.ts

**Issue GitHub:** #153
**Tipo:** bugfix
**Prioridad:** P1: High
**Rama:** `fix/079-commit-prisma-logger`
**Estado:** COMPLETADO
**Fecha:** 2026-09-02

---

## 1. CONTEXTO

Hay un cambio funcional importante en `src/lib/logger.ts` que existía en el working tree local pero nunca fue commiteado a develop.

El cambio de `prisma/schema.prisma` que se intentó inicialmente (añadir `url` y `directUrl`) fue DESCARTADO: en Prisma v7 las URLs de conexión se configuran en `prisma.config.ts`, no en el schema. El `prisma.config.ts` ya tenía la configuración correcta desde el inicio.

---

## 2. OBJETIVO

Commitear el fix de `src/lib/logger.ts` (serializers de Error) a develop.

---

## 3. SCOPE

1. **`src/lib/logger.ts`** — añadir `serializers` para objetos Error (fix para crash de pino-pretty worker en Node.js/Windows)
2. **`prisma/schema.prisma`** — revertir los cambios incorrectos (url/directUrl no son válidos en Prisma v7)

---

## 4. ANTI-SCOPE

- NO commitear `prisma/migrations/20260612234333_initial_schema/` hasta que se analice si es válida o accidental
- NO tocar `prisma.config.ts` (ya está correctamente configurado con DIRECT_URL)

---

## 5. ARCHIVOS AFECTADOS

- `src/lib/logger.ts` (añadir serializers)
- `prisma/schema.prisma` (revertir cambio incorrecto)

---

## 6. ROOT CAUSE

### src/lib/logger.ts
En Node.js, pino-pretty corre en un worker thread separado. Pasar un objeto `Error` nativo via `postMessage` al worker lanza una excepción porque `Error` no es transferible entre contextos de thread. Los `serializers` convierten el Error a JSON plano antes del postMessage, evitando el crash ("the worker has exited").

### prisma/schema.prisma (análisis post-hoc)
Prisma v7 eliminó el soporte de `url` y `directUrl` en el datasource del schema. Las URLs de conexión deben estar en `prisma.config.ts`. El archivo ya tenía la configuración correcta (`url: process.env.DIRECT_URL ?? process.env.DATABASE_URL`). No era necesario modificar el schema.

---

## 7. DEFINITION OF DONE

- [x] `src/lib/logger.ts` commiteado con serializers
- [x] `prisma/schema.prisma` revertido al estado correcto (solo `provider = "postgresql"`)
- [x] CI verde
- [x] PR mergeado a develop
