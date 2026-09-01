# ISSUE DOC #085 — Fix: commitear migración Prisma 20260612234333_initial_schema

**Issue GitHub:** #164
**Tipo:** bugfix
**Prioridad:** P1: High
**Rama:** `fix/085-commit-migracion-initial-schema`
**Estado:** PENDIENTE
**Fecha:** 2026-09-02

---

## 1. CONTEXTO

La migración `prisma/migrations/20260612234333_initial_schema/migration.sql` existe en el working tree local pero nunca fue commiteada a git. Apareció como `??` (untracked) en `git status`.

Esta migración crea tres tablas del dominio:
- `artist_profile` (modelo `ArtistProfile` — issue #044)
- `studio_info` (modelo `StudioInfo` — issue #044)
- `studio_config` (modelo `StudioConfig` — issue #045)

Las issues #044 y #045 se implementaron y mergearon a develop, pero la migración Prisma generada localmente nunca se commiteó al repositorio.

---

## 2. ROOT CAUSE

Las issues #044 y #045 modificaron el schema Prisma añadiendo `ArtistProfile`, `StudioInfo` y `StudioConfig`. Al ejecutar `prisma migrate dev` localmente, Prisma generó esta migración, pero no se incluyó en el commit/PR de esas issues. El proceso de governance falló en ese punto.

---

## 3. OBJETIVO

Commitear la migración para que:
1. Fresh deployments (nuevas instancias, entornos de CI con BD real, nuevos devs) creen las tablas correctamente
2. La historia de migraciones en git sea completa y coherente

---

## 4. SCOPE

- Commitear `prisma/migrations/20260612234333_initial_schema/migration.sql` tal como está

---

## 5. ANTI-SCOPE

- NO modificar el contenido del SQL
- NO tocar el schema.prisma
- NO crear nuevas migraciones

---

## 6. ANÁLISIS DE LA MIGRACIÓN

```sql
-- CreateTable artist_profile
-- CreateTable studio_info
-- CreateTable studio_config
```

Estas tablas ya existen en la base de datos de producción/desarrollo (el código las usa desde hace meses). La migración es correcta en cuanto a estructura.

**Riesgo en DBs existentes:** Si se ejecuta `prisma migrate deploy` en una DB donde estas tablas ya existen, fallará con "relation already exists". La solución es marcar la migración como ya aplicada:

```bash
pnpm prisma migrate resolve --applied 20260612234333_initial_schema
```

Esto registra la migración en la tabla `_prisma_migrations` sin ejecutar el SQL, evitando el conflicto.

---

## 7. FLUJO DE EJECUCIÓN

1. Crear rama `fix/085-commit-migracion-initial-schema`
2. `git add prisma/migrations/20260612234333_initial_schema/`
3. Commit y PR
4. Verificar CI verde (el CI no ejecuta migraciones, solo `prisma generate`)
5. Merge a develop
6. En la DB de producción/staging existente, ejecutar:
   ```bash
   pnpm prisma migrate resolve --applied 20260612234333_initial_schema
   ```

---

## 8. DOCUMENTACIÓN AFECTADA

Ninguna — la migración corresponde a modelos ya documentados en DATA-001.

---

## 9. DEFINITION OF DONE

- [x] Migración commiteada y en git
- [x] CI verde (prisma generate no ejecuta migraciones)
- [x] PR mergeado a develop
- [ ] En producción: `prisma migrate resolve --applied 20260612234333_initial_schema` ejecutado al próximo deploy
