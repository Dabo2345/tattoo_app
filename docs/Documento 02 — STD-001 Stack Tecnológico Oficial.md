# STD-001 — Stack Tecnológico Oficial

## Estado

Aprobado

## Versión

1.1

## Fecha

2026-06-02

---

# 1. Filosofía tecnológica

La selección tecnológica prioriza:

* Simplicidad
* Mantenibilidad
* Coste reducido
* Productividad
* Integración con IA

---

# 2. Frontend

## Framework

Next.js 15

---

## Lenguaje

TypeScript

Configuración:

strict = true

---

## UI

React 19

---

## Estilos

Tailwind CSS 4

---

## Componentes

Shadcn/UI

---

## Formularios

React Hook Form

---

## Validación

Zod

---

## Estado Cliente

TanStack Query

Uso permitido:

* Cache
* Revalidación
* Sincronización servidor

---

# 3. Backend

Arquitectura:

Next.js Full Stack

---

## API

* Route Handlers
* Server Actions

---

## Logging

Pino

---

# 4. Base de Datos

## Motor

PostgreSQL 16+

Proveedor:

Supabase

---

## ORM

Prisma

---

## Migraciones

Prisma Migrate

---

# 5. Autenticación

## Solución

Better Auth

---

## Alcance

Solo administrador.

Los clientes no tendrán cuentas.

---

# 6. Almacenamiento

## Servicio

Supabase Storage

Uso:

* Galería
* Fotos perfil
* Fotos estudio

---

# 7. Email

## Servicio

Resend

Uso:

* Confirmaciones
* Cancelaciones
* Recordatorios
* Session Links
* Magic Links

---

# 8. Pagos

## Servicio

Stripe

Funciones:

* Checkout
* Reembolsos
* Webhooks

---

# 9. Monitorización

## Errores

Sentry

---

# 10. Testing

## Unit

Vitest

---

## Componentes

Testing Library

---

## E2E

Playwright

---

## Cobertura mínima

80%

---

# 11. Calidad de Código

## Lint

ESLint

---

## Formato

Prettier

---

## Git Hooks

Husky

---

## Validación commits

Commitlint

---

# 12. CI/CD

GitHub Actions

Pipelines obligatorios:

* Lint
* Typecheck
* Tests
* Build

---

# 13. Hosting

Proveedor:

Vercel

---

## Entornos

* Development
* Staging
* Production

---

# 14. Coste Operativo Objetivo

Objetivo MVP:

0€/mes

Excepción:

* Dominio
* Comisiones Stripe por ventas reales

---

# 15. Dependencias prohibidas

* Redux
* Bootstrap
* jQuery
* Moment.js
* JavaScript sin tipado
* Microservicios

---

# 16. Cambios tecnológicos

Toda modificación del stack requerirá:

ADR aprobado que documente:

* Beneficios
* Riesgos
* Costes
* Impacto técnico
