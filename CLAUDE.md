# CLAUDE.md — EXECUTION CONTROL SYSTEM

> Versión: 3.0 | Fecha: 2026-06-12 | Estado: ACTIVO Y OBLIGATORIO

---

# PRINCIPIO ABSOLUTO DEL SISTEMA

Este proyecto opera bajo un sistema de control estricto y determinista.

Claude actúa únicamente como **Execution Agent**.
No como agente creativo, no como arquitecto libre, no como improvisador.

**Si no está en una Issue o ISSUE DOC → no existe.**

---

# DOCUMENTACION DEL SISTEMA

Antes de cualquier acción, Claude debe conocer los documentos de referencia:

| Documento | Ruta | Propósito |
|-----------|------|-----------|
| ADR-001 | /docs/Documento 01 — ADR-001 Arquitectura General del Sistema.md | Arquitectura del sistema |
| STD-001 | /docs/Documento 02 — STD-001 Stack Tecnológico Oficial.md | Stack tecnológico aprobado |
| GOV-001 | /docs/Documento 02B — GOV-001 Gobernanza del Proyecto y Workflow de Desarrollo.md | Reglas de gobernanza |
| DATA-001 | /docs/Documento 03 — DATA-001 — Modelo de Dominio y Base de Datos.md | Modelo de datos |
| DATA-002 | /docs/Documento 04 — DATA-002 — Reglas de Negocio del Dominio.md | Reglas de negocio |
| API-001 | /docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md | Contratos de API |
| AUTH-001 | /docs/Documento 06 — AUTH-001 — Autenticación, Autorización y Seguridad.md | Auth y seguridad |
| UX-001 | /docs/Documento 07 — UX-001 — Flujos de Usuario y Experiencia de Uso.md | Flujos UX |
| UI-001 | /docs/Documento 08 — UI-001 — Sistema de Diseño.md | Sistema de diseño |
| FRONT-001 | /docs/Documento 09 — FRONT-001 — Arquitectura Frontend.md | Arquitectura frontend |
| BACK-001 | /docs/Documento 15 — BACK-001 — Arquitectura Backend.md | Arquitectura backend |
| TEST-001 | /docs/Documento 010 — TEST-001 — Estrategia de Testing y Calidad copy.md | Estrategia testing |
| DEVOPS-001 | /docs/Documento 011 — DEVOPS-001 — GItHub Flow y Automatizacion y CI CD.md | CI/CD y GitHub Flow |
| PM-001 | /docs/Documento 012 — PM-001 — Product Management, Roadmap y Sistema de Issues.md | Product management |
| PM-002 | /docs/Documento 013 — PM-002 — Issue Generator System.md | Generador de issues |
| NOTIF-001 | /docs/Documento 16 — NOTIF-001 — Sistema de Notificaciones.md | Sistema de notificaciones |
| ENV-001 | /docs/Documento 17 — ENV-001 — Variables de Entorno.md | Variables de entorno |
| ERROR-001 | /docs/Documento 18 — ERROR-001 — Estrategia de Error Handling.md | Manejo de errores |
| ISSUE-DOC-001 | /issues-docs/Documento 014 — ISSUE-DOC-001 — Issue Documentation System.md | Sistema de issue docs |

---

# FLUJO OBLIGATORIO DE TRABAJO

Todo trabajo sigue este flujo exacto. Sin excepciones.

```
Issue creada en GitHub (PM-001)
        ↓
ISSUE DOC creado en /issues-docs/
  └─ incluye sección DOCUMENTACIÓN AFECTADA
        ↓
Claude lee ISSUE DOC completo
        ↓
Claude implementa SOLO lo descrito
        ↓
Claude añade tests requeridos
        ↓
Claude actualiza docs en /docs/ (ver DOCUMENTACIÓN AFECTADA del ISSUE DOC)
        ↓
Claude crea PR con descripción completa
        ↓
CI valida (lint + typecheck + tests + build)
        ↓
Merge a develop
        ↓
Issue cerrada
```

---

# REGLAS DE BLOQUEO ABSOLUTO

Claude NO PUEDE bajo ninguna circunstancia:

- Trabajar sin Issue asignada
- Resolver más de 1 issue a la vez
- Mezclar funcionalidad de múltiples issues
- Improvisar features no documentadas
- Modificar arquitectura sin ADR aprobado
- Cambiar el stack tecnológico sin aprobación
- Eliminar código sin análisis de impacto documentado
- Hacer commits directos a `main` o `develop`
- Saltar la validación de CI
- Añadir dependencias no aprobadas en STD-001
- Escribir lógica de negocio en componentes UI
- Acceder a Stripe o Resend desde el frontend

---

# ISSUE DOC SYSTEM (OBLIGATORIO)

Cada Issue tiene un ISSUE DOC en:

```
/issues-docs/[ID]-[nombre-kebab-case].md
```

Ejemplo:
```
/issues-docs/001-configuracion-repositorio.md
/issues-docs/002-setup-nextjs-base.md
```

## Estructura obligatoria del ISSUE DOC

Cada ISSUE DOC debe contener:

1. **CONTEXTO** — Por qué existe esta tarea
2. **OBJETIVO** — Qué construir exactamente
3. **SCOPE** — Qué está incluido
4. **ANTI-SCOPE** — Qué no está permitido
5. **ARCHIVOS AFECTADOS** — Lista explícita (código + docs)
6. **FLUJO DE EJECUCIÓN** — Pasos obligatorios
7. **REGLAS DE NEGOCIO** — Reglas del dominio aplicables
8. **CRITERIOS DE ACEPTACIÓN** — Checklist verificable
9. **EDGE CASES** — Casos límite obligatorios
10. **TESTS REQUERIDOS** — Unit, integration, e2e
11. **DOCUMENTACIÓN AFECTADA** — Qué archivos de `/docs/` actualizar al cerrar
12. **DEPENDENCIAS** — Issues que deben completarse antes
13. **DEFINITION OF DONE** — Checklist de cierre (incluye "docs actualizados")

---

# EJECUCIÓN POR ID

Cuando el usuario diga:

> "resuelve issue 12"

Claude debe:

1. Leer `/issues-docs/012-*.md` completo
2. Verificar que las dependencias están cerradas
3. Crear rama: `feature/012-nombre-issue`
4. Implementar SOLO lo descrito en el ISSUE DOC
5. Añadir tests requeridos
6. Verificar que CI pasa localmente
7. Crear PR con template de DEVOPS-001

---

# REGLAS DE CÓDIGO

## Stack tecnológico

Solo se permite lo definido en STD-001:

- Next.js 15 + React 19 + TypeScript strict
- TailwindCSS 4 + Shadcn/UI
- Prisma + PostgreSQL (Supabase)
- Better Auth
- Stripe (solo backend)
- Resend (solo backend)
- Vitest + Playwright + Testing Library

## Estructura de módulos

Toda lógica de negocio va en:

```
/src/modules/[nombre-modulo]/
  services/     ← lógica de negocio
  repositories/ ← acceso a datos
  schemas/      ← validación Zod
  types/        ← tipos TypeScript
  api/          ← llamadas externas
```

## Reglas de componentes

- Server Component por defecto
- "use client" solo cuando sea estrictamente necesario
- Cero lógica de negocio en componentes
- Props siempre tipadas con TypeScript

## Reglas de API

- Toda entrada validada con Zod
- Respuestas tipadas con formato `{ success, data }` o `{ success, error }`
- Nunca exponer errores internos al cliente
- Toda API admin: autenticada + autorizada + audit logged

---

# TESTING OBLIGATORIO

Ninguna issue puede cerrarse sin:

- Tests unitarios para lógica de negocio
- Tests de integración para APIs
- CI completamente verde
- Cobertura mínima: 80% global, 100% en booking/payments/auth/magic-links

---

# SISTEMA DE DOCUMENTACIÓN VIVA

## Principio

> El código y la documentación deben estar siempre sincronizados.
> Si el código cambia y la documentación no → la documentación miente.

## Capas de documentación

| Capa | Ubicación | Contenido | Actualizar cuando |
|------|-----------|-----------|-------------------|
| **Reglas de ejecución** | `CLAUDE.md` | Cómo trabaja Claude en este proyecto | Cambia el proceso |
| **Docs de arquitectura** | `/docs/` | Cómo funciona el sistema ahora | Se cierra cualquier issue |
| **ISSUE DOCs** | `/issues-docs/` | Instrucciones de implementación por issue | Al crear la issue |

## Qué doc actualizar según el tipo de cambio

| Tipo de cambio | Documento a actualizar |
|----------------|------------------------|
| Nueva API o cambio de contrato | `API-001` |
| Cambio en reglas de negocio | `DATA-002` |
| Nuevo servicio o módulo backend | `BACK-001` |
| Cambio en schema de DB | `DATA-001` |
| Cambio en autenticación o seguridad | `AUTH-001` |
| Cambio en sistema de notificaciones | `NOTIF-001` |
| Nueva variable de entorno | `ENV-001` |
| Cambio en estrategia de tests | `TEST-001` |
| Cambio en CI/CD | `DEVOPS-001` |
| Cambio en componentes o diseño UI | `UI-001` o `FRONT-001` |
| Cambio en flujos de usuario | `UX-001` |

## Regla de Documentation-First en bugfixes

Cuando se corrige un bug, el ISSUE DOC debe incluir:
- **Root cause**: por qué ocurrió el bug
- **Fix aplicado**: qué se cambió y por qué
- **Doc actualizado**: qué sección del doc de arquitectura refleja el comportamiento correcto ahora

---

# OUTPUT OBLIGATORIO AL COMPLETAR ISSUE

Al terminar una issue, Claude debe responder:

```
## Issue Completada: #[ID]

### Archivos modificados
- [lista de archivos de código]
- [lista de archivos de /docs/ actualizados]

### Tests añadidos
- [lista de tests]

### Documentación actualizada
- [doc actualizado] — [sección y qué se cambió]

### Cómo probarlo
[instrucciones de prueba manual]

### Riesgos detectados
[cualquier riesgo o deuda técnica identificada]

### PR creado
[nombre del PR y rama]
```

---

# CAMBIOS PROHIBIDOS SIN PROCESO

| Acción | Requiere |
|--------|---------|
| Cambio de arquitectura | ADR aprobado |
| Nuevo módulo | Issue + ISSUE DOC |
| Nueva dependencia | Evaluación en STD-001 |
| Eliminación de código | Análisis de impacto documentado |
| Cambio en schema DB | Migración Prisma + Issue |
| Cambio en API pública | Actualización API-001 |
| Cambio en UI tokens | Actualización UI-001 |
| Refactor global | Issue separada de tipo `refactor/*` |

---

# REGLA FINAL

Este sistema es determinista.

```
Sin Issue → No existe
Sin ISSUE DOC → No se empieza
Sin tests → No se cierra
Sin docs actualizados → No se cierra
Sin CI verde → No se mergea
```
