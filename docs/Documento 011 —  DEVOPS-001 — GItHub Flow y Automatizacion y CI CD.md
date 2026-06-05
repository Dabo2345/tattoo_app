# DEVOPS-001 — CI/CD, GitHub Flow y Automatización

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-05

---

# 1. Objetivo

Definir un sistema de desarrollo seguro basado en:

* GitHub Flow estructurado
* Pull Requests obligatorios
* Validación automática
* Entornos separados
* Deploy controlado
* Integración con agentes (Claude-ready)

---

# 2. Modelo de trabajo

## Rama principal

main

* producción estable
* nunca se trabaja directamente aquí

---

## Rama de desarrollo

develop

* integración de features
* staging automático

---

## Features

feature/*

Ejemplo:

feature/booking-engine

feature/gallery-upload

---

## Hotfix

hotfix/*

Para errores críticos en producción

---

# 3. Regla de oro Git

> Todo cambio entra mediante Pull Request.

Nunca commits directos a main o develop.

---

# 4. Pull Request System

## Obligatorio en cada PR

Un PR debe incluir:

* descripción clara
* cambios realizados
* impacto en sistema
* tests asociados
* checklist completado

---

## Template PR

```md
## Summary

## Changes

## Why

## How to test

## Linked Issue

## Checklist
- [ ] Tests added
- [ ] Tests passing
- [ ] No breaking changes
- [ ] Documentation updated
```

---

# 5. GitHub Issues System

## Estructura obligatoria

Todo trabajo nace desde Issue.

---

## Tipos de Issue

### Epic

Gran funcionalidad

Ej:

Booking System

---

### Feature

Parte de epic

Ej:

Stripe Checkout Integration

---

### Task

Trabajo técnico

Ej:

Implement webhook handler

---

### Bug

Error detectado

---

## Jerarquía

Epic
→ Features
→ Tasks
→ Subtasks

---

# 6. Reglas de Issues

Cada issue debe tener:

* contexto
* definición clara
* criterios de aceptación
* dependencias
* referencia a docs

---

# 7. Branch Strategy

```text
main
 ↑
develop
 ↑
feature/*
 ↑
task/*
```

---

# 8. CI/CD Pipeline

## En cada PR

Se ejecuta:

* lint
* typecheck
* unit tests
* integration tests

---

## En merge a develop

* build
* deploy staging
* run e2e tests

---

## En merge a main

* build production
* deploy production
* smoke tests

---

# 9. Environments

## Development

Local machine

---

## Staging

Réplica producción

* testing real
* datos simulados

---

## Production

Sistema final

---

# 10. Automatización con GitHub Actions

## Workflows

### ci.yml

* lint
* test
* build

---

### deploy-staging.yml

* build
* deploy supabase + frontend
* run e2e

---

### deploy-prod.yml

* build
* deploy production
* verify health

---

# 11. Protección de ramas

## main

* requiere PR
* requiere aprobación
* requiere tests verdes

---

## develop

* requiere PR
* tests obligatorios

---

# 12. Quality Gates

Un PR NO puede hacerse merge si:

* fallan tests
* falla lint
* falla typecheck
* falta issue asociado

---

# 13. Integración con Claude (Agentes)

## Regla clave

Claude nunca escribe directamente en main.

---

## Flujo correcto

1. Claude crea branch
2. Claude genera cambios
3. Claude crea PR
4. CI valida
5. humano revisa o auto-approve si seguro
6. merge

---

## Claude Output Format

Cada cambio debe incluir:

* diff explicado
* archivos modificados
* tests sugeridos
* issue asociado

---

# 14. Commit Convention

## Formato

```
type(scope): description
```

---

## Types

* feat
* fix
* refactor
* test
* chore

---

# 15. Versionado

SemVer

* MAJOR: breaking changes
* MINOR: features
* PATCH: fixes

---

# 16. Seguridad

* secrets en GitHub Secrets
* nunca en repo
* rotación periódica

---

# 17. Rollback Strategy

* deploys versionados
* rollback automático si healthcheck falla
* supabase migrations versionadas

---

# 18. Golden Rule

> Ningún cambio entra en producción sin PR + tests + CI verde.
