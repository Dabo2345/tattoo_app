# ISSUE DOC #080 — Housekeeping: commitar ISSUE DOCs no rastreados y eliminar .pr-body-*.md del root

**Issue GitHub:** #154
**Tipo:** housekeeping
**Prioridad:** Normal
**Rama:** `housekeeping/080-cleanup-issue-docs`
**Estado:** PENDIENTE
**Fecha:** 2026-09-02

---

## 1. CONTEXTO

Hay 5 archivos de ISSUE DOC que existen localmente pero nunca fueron commiteados a git (aparecen como `??` en `git status`). Esto rompe la trazabilidad del sistema ISSUE DOC — si alguien clona el repo, no tiene los docs de esas issues.

Adicionalmente hay 7 archivos `.pr-body-*.md` en la raíz del proyecto que son artefactos temporales generados durante la creación de PRs con la CLI. No tienen valor permanente y contaminan el root.

---

## 2. OBJETIVO

- Commitear los 5 ISSUE DOCs existentes al repositorio
- Eliminar los 7 archivos `.pr-body-*.md` del root

---

## 3. SCOPE

### ISSUE DOCs a commitear
- `issues-docs/067-backend-eliminar-stripe-consulta.md`
- `issues-docs/074-bugfix-email-timezone-hora-incorrecta.md`
- `issues-docs/075-bugfix-session-link-404.md`
- `issues-docs/076-mejora-session-link-confirmacion-email.md`
- `issues-docs/078-bugfix-session-link-availability-slots.md`

### Archivos a eliminar
- `.pr-body-029.md` — `.pr-body-035.md` (7 archivos)

---

## 4. ANTI-SCOPE

- NO modificar el contenido de los ISSUE DOCs
- NO tocar ningún archivo de código

---

## 5. FLUJO DE EJECUCIÓN

1. Crear rama `housekeeping/080-cleanup-issue-docs`
2. `git add` los 5 ISSUE DOCs
3. Eliminar los 7 `.pr-body-*.md`
4. Commit y PR

---

## 6. DEFINITION OF DONE

- [ ] Los 5 ISSUE DOCs están en el repositorio
- [ ] Los 7 `.pr-body-*.md` eliminados del root
- [ ] CI verde
- [ ] PR mergeado a develop
