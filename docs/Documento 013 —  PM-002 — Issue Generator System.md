# PM-002 — Issue Generator System

## Estado

Activo

## Versión

1.0

---

# 1. OBJETIVO

Crear un sistema que:

* convierta PM-001 (requisitos + epics) en issues estructuradas
* genere automáticamente ISSUE DOCs
* mantenga dependencias correctas
* garantice orden de ejecución
* elimine improvisación humana en la creación de tareas

---

# 2. PRINCIPIO FUNDAMENTAL

> El backlog no se escribe a mano. Se genera de forma estructurada y determinista.

---

# 3. INPUT DEL SISTEMA

El sistema consume:

## 3.1 PM-001 (Product Specification)

* epics
* features
* prioridades
* reglas de negocio

---

## 3.2 Architecture Docs

* CLAUDE.md
* DEVOPS-001
* TEST-001
* ISSUE-DOC-001

---

# 4. OUTPUT DEL SISTEMA

El sistema genera:

## 4.1 GitHub Issues

Ejemplo:

```
#001 — Setup Supabase schema
#002 — Booking slot engine
#003 — Stripe checkout integration
```

---

## 4.2 ISSUE DOCS AUTOMÁTICOS

Ubicación:

```
/issues-docs/
```

Ejemplo:

```
001-supabase-schema.md
002-booking-engine.md
```

---

## 4.3 DEPENDENCY GRAPH

Cada issue incluye:

* dependencias explícitas
* orden de ejecución
* bloqueo automático si falta dependencia

---

# 5. REGLAS DE GENERACIÓN DE ISSUES

## 5.1 Atomicidad

Cada issue debe ser:

* pequeña
* ejecutable en 1–2 días máximo
* independiente o con dependencias claras

---

## 5.2 No ambigüedad

Prohibido:

* “implementar sistema de reservas”
* “mejorar performance”

Correcto:

* “validar disponibilidad de slots en Booking Engine”
* “crear endpoint de Stripe checkout”

---

## 5.3 Orden obligatorio

El sistema SIEMPRE respeta:

```
1. Infraestructura
2. Auth
3. Database schema
4. Core business logic
5. UI
6. Notifications
7. Hardening
```

---

# 6. ALGORITMO DE GENERACIÓN (CLAUDE RULE)

Cuando Claude genera issues debe:

## Paso 1

Leer PM-001 completo

---

## Paso 2

Dividir en EPICS

---

## Paso 3

Descomponer EPICS en FEATURES

---

## Paso 4

Convertir FEATURES en TASK ISSUES

---

## Paso 5

Asignar prioridad:

* P0 → bloqueante
* P1 → core
* P2 → UX
* P3 → mejoras

---

## Paso 6

Generar ISSUE DOC por cada issue

---

# 7. FORMATO DE ISSUE GENERADO

```md id="issue-format"
# ISSUE #[ID] — [Título]

## Epic
[Nombre del epic]

## Type
Feature / Task / Bug

## Priority
P0 / P1 / P2 / P3

## Dependencies
- Issue #X
- Issue #Y

## Description
[explicación técnica clara]

## Acceptance Criteria
- [ ] criterio 1
- [ ] criterio 2

## Related ISSUE DOC
/issues-docs/XXX.md
```

---

# 8. GENERACIÓN DE ISSUE DOC AUTOMÁTICO

Cada issue genera automáticamente:

## TEMPLATE:

```md id="issue-doc-auto"
# ISSUE #[ID] — [TITLE]

## Context
Derivado de PM-001 / Epic X

## Objective
Qué debe implementarse

## Scope
Qué incluye

## Out of scope
Qué NO incluye

## Implementation Plan
Paso a paso técnico

## Business Rules
Reglas del dominio

## API / Modules affected
- /modules/...

## Test cases
- unit
- integration
- e2e (si aplica)

## Edge cases
- ...
```

---

# 9. DEPENDENCY ENGINE (CRÍTICO)

## Regla:

Una issue NO puede ejecutarse si:

* depende de otra no terminada

---

## Ejemplo:

```
Issue #2 (Booking Engine)
↓ depende de
Issue #1 (Database Schema)
```

---

# 10. INTEGRACIÓN CON CLAUDE (FLUJO REAL)

---

## COMANDO 1 — generar backlog

```
claude generate issues from PM-001
```

---

## RESULTADO

* issues en GitHub
* docs creados
* ordenado
* listo para ejecución

---

## COMANDO 2 — ejecutar issue

```
claude resolve issue 12
```

---

## FLUJO INTERNO

1. load issue
2. load ISSUE DOC
3. implement
4. test
5. PR
6. report

---

# 11. REGLAS DE CONTROL (MUY IMPORTANTE)

## Prohibido:

* editar issues manualmente sin regeneración
* cambiar orden de dependencias sin PM-001 update
* mezclar issues

---

## Obligatorio:

* toda issue debe tener ISSUE DOC
* toda issue debe ser ejecutable aislada
* toda issue debe ser testeable

---

# 12. BENEFICIO REAL DEL SISTEMA

Con esto consigues:

## Antes:

❌ tú piensas tareas
❌ tú divides trabajo
❌ riesgo de errores humanos

---

## Ahora:

✔ IA genera backlog
✔ IA crea documentación
✔ IA ejecuta issues
✔ sistema determinista

---

# 13. GOLDEN RULE

> El desarrollador no inventa tareas. Solo ejecuta lo que el sistema genera.
