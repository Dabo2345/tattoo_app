# GOV-001 — Gobernanza del Proyecto y Workflow de Desarrollo

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-02

---

# 1. Objetivo

Definir las reglas obligatorias de desarrollo, control de cambios, gestión de tareas y colaboración con IA para garantizar:

* Calidad del código.
* Estabilidad del sistema.
* Trazabilidad completa.
* Mantenimiento a largo plazo.
* Desarrollo profesional.

---

# 2. Principios Fundamentales

## GP-001 — La documentación es la fuente de verdad

La documentación oficial prevalece sobre:

* Conversaciones.
* Comentarios.
* Suposiciones.
* Código existente.

Si existe contradicción:

La documentación debe actualizarse antes de modificar el código.

---

## GP-002 — Nada se desarrolla sin planificación

Toda funcionalidad deberá estar asociada a una Issue.

No se permite implementar cambios directamente.

---

## GP-003 — Todo cambio debe ser trazable

Cada modificación deberá poder rastrearse mediante:

Issue
→ Branch
→ Commit
→ Pull Request
→ Merge

---

## GP-004 — Calidad antes que velocidad

La velocidad de desarrollo nunca justificará:

* Saltarse tests.
* Saltarse revisiones.
* Saltarse documentación.

---

# 3. Gestión de GitHub

## Modelo de ramas

Se utilizará un modelo simplificado.

Ramas permanentes:

main

develop

---

## Ramas temporales

feature/<nombre>

fix/<nombre>

refactor/<nombre>

docs/<nombre>

test/<nombre>

---

## Ejemplos

feature/booking-consultation

feature/session-link

fix/calendar-overlap

refactor/payment-module

docs/database-model

---

# 4. Política de Issues

## Regla

Nada podrá desarrollarse sin una Issue previa.

---

## Jerarquía

EPIC

↓

FEATURE

↓

TASK

---

## Ejemplo

EPIC-001 Sistema de Reservas

↓

FEATURE-001 Reserva Consultation

↓

TASK-001 Crear modelo Consultation

TASK-002 Crear endpoint reserva

TASK-003 Integrar Stripe

TASK-004 Tests unitarios

TASK-005 Tests integración

---

## Campos obligatorios

Título

Descripción

Objetivo

Criterios de aceptación

Dependencias

Definición de terminado

---

# 5. Definición de Terminado (Definition of Done)

Una tarea se considerará completada únicamente si:

* Código implementado.
* Tests creados.
* Tests superados.
* Build correcta.
* Lint correcto.
* Typecheck correcto.
* Documentación actualizada.
* Pull Request aprobada.

---

# 6. Política de Pull Requests

Toda Pull Request deberá:

* Referenciar una Issue.
* Explicar el objetivo.
* Explicar los cambios.
* Explicar riesgos.
* Incluir evidencia de tests.

---

## Plantilla obligatoria

Issue relacionada

Objetivo

Cambios realizados

Archivos afectados

Riesgos identificados

Tests realizados

Checklist final

---

# 7. Política de Commits

Se utilizará Conventional Commits.

---

## Permitidos

feat

fix

refactor

docs

test

chore

ci

build

---

## Ejemplos

feat(booking): create consultation flow

fix(calendar): prevent slot overlap

docs(database): add consultation entity

test(payment): add refund tests

---

# 8. Política de Testing

## Regla principal

Toda modificación requiere tests.

---

## Tipos

Unit

Integration

End-to-End

---

## Cobertura mínima

80%

Global

---

## Obligatorio

Ninguna Pull Request podrá fusionarse con tests fallando.

---

# 9. Política de Refactorización

Antes de refactorizar:

* Analizar dependencias.
* Analizar cobertura existente.
* Analizar impacto.

---

Toda refactorización deberá:

* Mantener comportamiento.
* Mantener tests.
* Mantener documentación.

---

# 10. Política de Eliminación de Código

No se permite eliminar código sin:

* Justificación.
* Análisis de impacto.
* Revisión de dependencias.

---

Toda eliminación deberá documentar:

Motivo

Archivos afectados

Impacto esperado

Riesgos

---

# 11. Reglas para Claude

Claude actuará como miembro del equipo de ingeniería.

---

## Claude NO podrá

Modificar arquitectura sin ADR.

Modificar stack sin ADR.

Eliminar módulos sin análisis.

Modificar base de datos sin documentación.

Implementar funcionalidades sin Issue.

---

## Claude DEBERÁ

Analizar primero.

Presentar plan.

Identificar archivos afectados.

Identificar riesgos.

Definir tests necesarios.

Esperar aprobación.

Implementar.

Actualizar documentación.

Generar PR.

---

## Formato obligatorio previo a cambios

Objetivo

Análisis

Archivos afectados

Impacto

Riesgos

Plan de implementación

Tests necesarios

---

# 12. Gestión de Dependencias

Antes de añadir una dependencia:

* Verificar necesidad real.
* Verificar mantenimiento activo.
* Verificar compatibilidad TypeScript.
* Verificar impacto en bundle.

---

Toda nueva dependencia requerirá:

Justificación documentada.

---

# 13. Gestión de Seguridad

Todo cambio relacionado con:

* Autenticación
* Pagos
* Permisos
* Datos personales

deberá incluir revisión de seguridad.

---

# 14. Gestión de Documentación

Toda funcionalidad deberá actualizar:

Arquitectura

Modelo de datos

API

Reglas de negocio

si resulta afectada.

---

# 15. Protección de main

La rama main deberá estar protegida.

---

Requisitos mínimos:

* Pull Request obligatoria.
* Checks obligatorios.
* Build exitosa.
* Tests exitosos.
* Typecheck exitoso.
* Lint exitoso.

---

No se permitirán pushes directos a main.

---

# 16. Principio Rector del Proyecto

Toda decisión deberá favorecer:

Mantenibilidad

Trazabilidad

Estabilidad

Claridad

sobre la velocidad de implementación.
