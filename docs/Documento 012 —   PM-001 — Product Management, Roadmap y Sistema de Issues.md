# PM-001 — Product Management, Roadmap y Sistema de Issues

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-05

---

# 1. Objetivo

Definir:

* cómo se organiza el trabajo en GitHub
* cómo se descompone el producto en Epics
* cómo se prioriza el desarrollo
* cómo Claude debe generar Issues sin ambigüedad
* cómo evitar desarrollo desordenado

---

# 2. Principio de construcción

> El sistema se construye de arriba hacia abajo en valor de negocio, no por conveniencia técnica.

---

# 3. Orden de desarrollo (CRÍTICO)

Este orden es obligatorio.

---

## Fase 1 — Foundation

1. Setup repo + CI/CD
2. Setup Next.js architecture
3. Setup Supabase
4. Setup Better Auth
5. Setup UI System (UI-001)
6. Base layout + routing

---

## Fase 2 — Core Booking Engine

1. Slot system
2. Availability engine
3. Consultation booking
4. Stripe integration
5. Payment webhooks
6. DepositPolicy logic

---

## Fase 3 — Client Experience

1. Home page
2. Profile page
3. Gallery
4. Studio info
5. MagicLink system
6. SessionLink system

---

## Fase 4 — Admin System

1. Admin login
2. Admin dashboard
3. Calendar management
4. Booking management
5. Gallery management
6. Content management

---

## Fase 5 — Notifications

1. Email provider
2. WhatsApp replacement (fallback email-only si aplica)
3. NotificationService
4. Reminder system (24h / 2h)

---

## Fase 6 — Hardening

1. Testing coverage
2. Performance optimization
3. Security audit
4. Load testing
5. Edge case fixes

---

# 4. Estructura de GitHub Issues

Cada Issue debe seguir esta estructura:

---

## TEMPLATE — Epic

```md id="epic001"
# EPIC: [Nombre]

## Objetivo
Descripción del objetivo global

## Valor de negocio
Por qué existe esto

## Alcance
Qué incluye

## Fuera de alcance
Qué NO incluye

## Issues hijas
- #123
- #124

## Criterios de éxito
- funcional
- testeado
- deployado
```

---

## TEMPLATE — Feature

```md id="feature001"
# FEATURE: [Nombre]

## Contexto
Explicación clara

## User story
Como X quiero Y para Z

## Requisitos técnicos
- ...
- ...

## API / módulos afectados
- ...

## Criterios de aceptación
- ...
```

---

## TEMPLATE — Task

```md id="task001"
# TASK

## Descripción
Trabajo técnico concreto

## Archivos afectados
- ...

## Dependencias
- ...

## Tests requeridos
- ...
```

---

# 5. Sistema de Epics (definitivo)

---

## EPIC 1 — System Foundation

Incluye:

* setup repo
* CI/CD
* arquitectura frontend
* supabase
* auth

---

## EPIC 2 — Booking Engine Core

Incluye:

* slots
* calendar logic
* stripe
* deposit policy

---

## EPIC 3 — Client Platform

Incluye:

* home
* gallery
* profile
* studio page

---

## EPIC 4 — Admin System

Incluye:

* dashboard
* calendar admin
* content management

---

## EPIC 5 — Notification System

Incluye:

* email
* reminders
* event triggers

---

## EPIC 6 — Magic & Session Links

Incluye:

* magic links
* session links
* secure token system

---

## EPIC 7 — Hardening & Scale

Incluye:

* testing
* performance
* security
* observability

---

# 6. Prioridad de Issues

## P0 (CRÍTICO)

* booking engine
* payments
* auth
* calendar

---

## P1 (ALTO)

* admin system
* gallery
* profile

---

## P2 (MEDIO)

* UI polish
* animations
* SEO

---

## P3 (BAJO)

* optimizaciones
* mejoras UX
* refactors

---

# 7. Regla de dependencia

Un Issue NO puede empezar si:

* su Epic no está creado
* sus dependencias no están cerradas
* no tiene criterios de aceptación claros

---

# 8. Definición de “Done”

Un Issue solo se considera terminado si:

* código implementado
* tests añadidos
* CI verde
* PR mergeado
* documentación actualizada

---

# 9. Sistema de creación de Issues (Claude-ready)

Claude debe:

## Paso 1

Analizar Epic

## Paso 2

Dividir en Features

## Paso 3

Dividir Features en Tasks pequeñas

## Paso 4

Crear Issues individuales

---

## Regla clave

> Ningún Issue debe requerir más de 1–2 días de trabajo.

---

# 10. Anti-bloat rule

Prohibido:

* issues gigantes
* “implementar sistema completo”
* tareas ambiguas

---

# 11. Roadmap visual

## Orden real

1. Infraestructura
2. Booking Engine
3. Client UX
4. Admin Panel
5. Notifications
6. Hardening

---

# 12. Integración con DEVOPS-001

Cada Issue debe:

* generar PR
* pasar CI
* estar ligado a branch feature/*

---

# 13. Golden Rule

> Si un Issue no puede describirse claramente en GitHub, no está listo para construirse.
