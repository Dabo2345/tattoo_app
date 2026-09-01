# ISSUE DOC #082 — Docs: actualizar CLAUDE.md y limpiar docs/ duplicados

**Issue GitHub:** #156
**Tipo:** docs
**Prioridad:** Normal
**Rama:** `docs/082-actualizar-claude-md`
**Estado:** PENDIENTE
**Fecha:** 2026-09-02

---

## 1. CONTEXTO

Se detectaron tres problemas de consistencia en la documentación:

1. `docs/Claude.md` es una versión obsoleta (sin fecha, sin tabla de documentos, sin flujo detallado) del `CLAUDE.md` raíz (v3.0). Genera confusión a quien lea el repo.
2. `docs/Documento 03B — DATA-001` existe pero no está referenciado en la tabla de CLAUDE.md.
3. `docs/Documento 19 — ONBOARD-001` y `docs/Documento 20 — DEPLOY-001` existen pero no están en la tabla de CLAUDE.md.

---

## 2. OBJETIVO

- Eliminar `docs/Claude.md` (obsoleto)
- Añadir las 3 entradas faltantes a la tabla de documentación en CLAUDE.md
- Actualizar la versión y fecha de CLAUDE.md

---

## 3. SCOPE

1. Eliminar `docs/Claude.md`
2. En `CLAUDE.md`, tabla "DOCUMENTACION DEL SISTEMA": añadir filas para DATA-001B, ONBOARD-001, DEPLOY-001
3. Actualizar header de CLAUDE.md: Versión 3.1, Fecha 2026-09-02

---

## 4. ANTI-SCOPE

- NO modificar el contenido de ningún documento de /docs/
- NO cambiar ninguna regla de governance ni flujos

---

## 5. FLUJO DE EJECUCIÓN

1. Eliminar `docs/Claude.md`
2. Editar tabla en `CLAUDE.md`
3. Actualizar versión/fecha header
4. Commit y PR

---

## 6. DEFINITION OF DONE

- [ ] `docs/Claude.md` eliminado
- [ ] Tabla de CLAUDE.md incluye DATA-001B, ONBOARD-001, DEPLOY-001
- [ ] CI verde
- [ ] PR mergeado a develop
