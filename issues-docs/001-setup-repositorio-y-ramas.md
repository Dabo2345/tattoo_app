# ISSUE #001 — Setup repositorio y ramas en GitHub

## Epic
EPIC 1 — System Foundation

## Type
Task

## Priority
P0

## Dependencies
Ninguna — es la primera issue del proyecto.

---

## Contexto

El repositorio existe pero solo tiene commits iniciales. No tiene la estructura de ramas definida en DEVOPS-001 ni las protecciones de branch configuradas. Este setup es el punto de partida absoluto del proyecto: sin él, ninguna otra issue puede seguir el flujo de trabajo correcto.

---

## Objetivo

Configurar el repositorio de GitHub con la estructura de ramas, protecciones y configuraciones base definidas en DEVOPS-001 y GOV-001.

---

## Scope

- Crear rama `develop` desde `main`
- Configurar protección de rama `main`: PR obligatorio, CI requerido, sin push directo
- Configurar protección de rama `develop`: PR obligatorio, tests requeridos
- Crear `.gitignore` correcto para Next.js + Node.js
- Crear `.gitattributes` para manejo de line endings
- Crear template de PR en `.github/pull_request_template.md`
- Crear templates de Issues en `.github/ISSUE_TEMPLATE/`
- Añadir `develop` branch en el repositorio remoto

---

## Anti-scope

- No instalar dependencias de Node.js todavía (#002)
- No configurar GitHub Actions todavía (#003)
- No escribir código de aplicación

---

## Archivos afectados

```
.gitignore
.gitattributes
.github/
  pull_request_template.md
  ISSUE_TEMPLATE/
    epic.md
    feature.md
    task.md
    bug.md
```

---

## Flujo de ejecución

1. Crear rama `develop` desde `main` en GitHub
2. Crear `.gitignore` para Next.js (incluir `.env*.local`, `.env.test`, `node_modules`, `.next`, etc.)
3. Crear `.gitattributes` (LF para todos los archivos de texto)
4. Crear template de PR con el formato de DEVOPS-001
5. Crear 4 templates de Issue (epic, feature, task, bug) con los formatos de PM-001
6. Configurar branch protection rules en GitHub Settings
7. Hacer commit y PR a `develop`

---

## Reglas de negocio aplicables

- GOV-001: Todo cambio entra via PR, nunca directo a `main` o `develop`
- DEVOPS-001: Estructura de ramas `main` + `develop` + `feature/*`
- DEVOPS-001: Branch protection rules obligatorias

---

## Criterios de aceptación

- [ ] Rama `develop` existe en el repositorio remoto
- [ ] `main` tiene protección: PR requerido, CI requerido (pendiente hasta #003), sin push directo
- [ ] `develop` tiene protección: PR requerido, tests requeridos (pendiente hasta #003)
- [ ] `.gitignore` excluye: `.env*.local`, `.env.test`, `.env.production`, `node_modules/`, `.next/`, `coverage/`, `.turbo/`
- [ ] Template de PR existe con secciones: Summary, Changes, Why, How to test, Linked Issue, Checklist
- [ ] Templates de Issue existen para: epic, feature, task, bug
- [ ] Los templates de Issue siguen el formato de PM-001

---

## Edge cases

- Si `develop` ya existe: verificar que está al día con `main`
- El campo "CI required" en branch protection puede quedar en "No required" hasta que se configure #003; documentar que se debe actualizar tras #003

---

## Tests requeridos

No aplica — esta issue es configuración de infraestructura Git, no código ejecutable.

---

## Definition of Done

- [ ] Rama `develop` creada y pusheada
- [ ] Branch protection configurada en GitHub
- [ ] Todos los archivos de `.github/` creados
- [ ] PR creado y mergeado a `develop`
- [ ] Issue cerrada en GitHub

---

## Contenido de los archivos a crear

### .gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# Environment files
.env*.local
.env.test
.env.production
.env.staging

# Coverage
coverage/
.nyc_output/

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.DS_Store
*.pem
.vercel
.turbo

# Playwright
/test-results/
/playwright-report/
/playwright/.cache/
```

### .github/pull_request_template.md

```markdown
## Summary
<!-- What does this PR do? 1-2 sentences -->

## Changes
<!-- List of main changes -->
-

## Why
<!-- Why is this change needed? -->

## How to test
<!-- Steps to manually verify this works -->
1.

## Linked Issue
<!-- Required: Fixes #XXX -->
Fixes #

## Checklist
- [ ] Tests added / updated
- [ ] All tests passing (CI green)
- [ ] No breaking changes
- [ ] Docs updated if needed
- [ ] TypeScript types correct
```
