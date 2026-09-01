# ISSUE DOC #083 — Governance: crear ISSUE DOCs y mergear TattooPlan EPIC (#069–#073)

**Issue GitHub:** #157
**Tipo:** chore / governance
**Prioridad:** Normal
**Rama:** `housekeeping/083-merge-tattooplan-epic`
**Estado:** PENDIENTE
**Fecha:** 2026-09-02

---

## 1. CONTEXTO

Las issues #069–#073 del TattooPlan EPIC fueron implementadas con código completo y CI verde en sus ramas respectivas, pero los PRs (#139–#143) nunca se mergearon a develop. Las issues en GitHub fueron cerradas prematuramente (antes del merge), violando el flujo obligatorio.

**Hallazgo positivo:** Las 5 ramas ya tienen ISSUE DOCs dentro de ellas. Los docs llegarán a develop cuando se mergeen los PRs.

---

## 2. OBJETIVO

Mergear los 5 PRs del TattooPlan EPIC en orden de dependencia para que el código llegue a develop.

---

## 3. SCOPE

Mergear en este orden:
1. **PR #139** — `feature/069-db-schema-tattooplan`
2. **PR #140** — `feature/070-backend-tattooplan-service-apis`
3. **PR #141** — `feature/071-api-disponibilidad-por-duracion`
4. **PR #142** — `feature/072-admin-ui-crear-plan-tatuaje`
5. **PR #143** — `feature/073-notificaciones-email-plan-tatuaje`

---

## 4. ANTI-SCOPE

- NO modificar el código de ninguna rama
- NO hacer rebase de las ramas (solo merge)

---

## 5. DEFINICIÓN DE DONE

- [ ] Los 5 PRs mergeados a develop en orden
- [ ] CI verde en develop tras cada merge
- [ ] Issues #083 cerrada

---

## 6. DEPENDENCIAS

Las ramas están en cadena: #069 → #070 → #071 → #072 → #073
