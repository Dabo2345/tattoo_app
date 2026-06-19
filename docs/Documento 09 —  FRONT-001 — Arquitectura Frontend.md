# FRONT-001 — Arquitectura Frontend

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-05

---

# 1. Objetivo

Definir la estructura, organización y reglas del frontend para garantizar:

* Escalabilidad
* Mantenibilidad
* Separación de responsabilidades
* Consistencia con el backend
* Integración clara con APIs y Server Actions

---

# 2. Stack Frontend

Framework:

Next.js 15 (App Router)

---

Lenguaje:

TypeScript (strict mode)

---

UI:

React 19

---

Estilos:

TailwindCSS (basado en UI-001 tokens)

---

Estado servidor:

TanStack Query

---

Estado local:

React useState / useReducer

---

Validación:

Zod

---

Forms:

React Hook Form

---

Auth:

Better Auth

---

---

# 3. Principio de Arquitectura

El frontend se divide en dos capas:

---

## Capa 1 — App Layer (Next.js Routes)

Responsable de:

* Routing
* Server Components
* Fetch inicial de datos
* Layouts
* Seguridad de rutas

---

## Capa 2 — Feature Modules

Responsable de:

* Lógica de negocio UI
* Componentes específicos
* Hooks
* API calls
* Validaciones
* State management local

---

# 4. Estructura de Carpetas

```
/src
  /app
    /(public)
    /(admin)
    /api

  /modules
    /booking
    /gallery
    /auth
    /admin
    /profile
    /studio
    /notifications

  /components
    /ui
    /layout
    /shared

  /lib
    /api
    /auth
    /db
    /utils

  /hooks

  /schemas

  /types

  /styles
```

---

# 5. App Router Structure

## Public routes

```
/ (home)
/perfil
/galeria
/estudio
/reservar
/session-link/[token]
/magic-link/[token]
```

---

## Admin routes

```
/admin
/admin/login
/admin/dashboard
/admin/calendar
/admin/gallery
/admin/settings
/admin/profile
```

---

# 6. Regla de Server vs Client Components

---

## Server Components (por defecto)

Se usarán para:

* Fetch inicial de datos
* Páginas públicas
* Layouts
* SEO pages

---

## Client Components

Solo cuando sea necesario:

* Formularios
* Interacción UI
* Calendario
* Drag & drop
* Modales
* Hooks de estado
* TanStack Query

---

Regla:

> Todo componente es Server Component salvo que se declare explícitamente como "use client"

---

# 7. Comunicación con Backend

## Estrategia híbrida

---

### REST API

Para:

* Booking
* Payments
* Sessions
* MagicLinks

---

### Server Actions

Para:

* Admin Panel
* Gallery uploads
* Profile updates
* Settings

---

---

# 8. API Layer

Ubicación:

```
/modules/*/api.ts
```

---

Reglas:

* Nunca llamar fetch directamente en componentes
* Toda llamada pasa por módulo
* Tipado obligatorio

---

Ejemplo:

```ts id="api-booking"
bookingApi.createConsultation()
bookingApi.getAvailability()
```

---

# 9. Módulos (Feature-Based Architecture)

Cada módulo contiene:

```
/modules/booking
  /components
  /hooks
  /api
  /schemas
  /types
  /utils
```

---

## Módulos definidos

### booking

Consultations
TattooSessions
Calendar
Slots

#### BookingWizard (`/modules/booking/components/booking-wizard.tsx`)

Componente público multi-paso para reservar consulta.

Estados (`WizardStep`):

```
"date" → "slot" → "form" → "confirmed"
```

Flujo actualizado (RB-NEW-001, issue #068):

* Paso `form`: envía POST /api/consultations
* En éxito: transiciona a `"confirmed"` en la misma página (sin redirección externa)
* Paso `"confirmed"`: muestra `ConfirmationView` con nombre del cliente, fecha y hora
* Errores de API (slot ocupado, red caída): se muestran inline en el formulario — el cliente puede reintentar sin salir

No realiza redirección a Stripe ni a ninguna URL externa.

---

### gallery

Images
Filters
Lightbox

---

### auth

Better Auth integration
Session handling

---

### admin

Dashboard
Calendar admin
Settings

---

### profile

Artist profile

---

### studio

Information page

---

### notifications

Client notifications logic

---

# 10. Reglas de Dependencias

---

## Permitido

* modules → components
* modules → lib
* modules → schemas

---

## Prohibido

* components → modules
* app → modules internos directamente
* cross-module imports sin API layer

---

# 11. Estado Global

No se utilizará Redux.

---

Se permite:

* React Query cache
* URL state
* local state

---

# 12. React Query (TanStack)

---

Reglas:

* Toda query debe tener key estable
* Cache control obligatorio
* Retry controlado

---

Ejemplo:

```
['availability', dateRange]
['appointments', clientId]
```

---

# 13. Forms

---

Reglas:

* React Hook Form obligatorio
* Zod resolver obligatorio
* Validación client + server

---

Errores:

* Inline por campo
* Nunca globales en formularios

---

# 14. Loading States

---

Todos los requests deben incluir:

* loading
* success
* error

---

Nunca UI sin estado.

---

# 15. Error Handling

---

Estrategia:

* Error boundaries en app layer
* Error mapping en API layer
* UI friendly messages

---

Nunca mostrar errores técnicos al usuario.

---

# 16. Performance

---

Reglas:

* Lazy loading obligatorio en módulos pesados
* Images optimizadas (WebP)
* Server Components por defecto
* Minimizar Client Components

---

# 17. SEO

---

Solo en:

* páginas públicas
* home
* galería
* perfil

---

Meta obligatorio:

* title
* description
* open graph

---

# 18. Seguridad Frontend

---

Reglas:

* Nunca exponer tokens sensibles
* Nunca almacenar secrets en frontend
* Validación siempre duplicada backend

---

# 19. Uploads

---

Flujo:

Client → Server Action → Supabase Storage

---

Reglas:

* Validación tamaño 10MB
* Solo JPEG / WebP
* Generar thumbnail obligatorio

---

# 20. Calendar System

---

Reglas:

* Slots de 30 minutos
* Timezone del artista obligatorio
* Bloqueos tienen prioridad absoluta

---

# 21. MagicLink Handling

---

Reglas:

* No requiere login
* Solo token validation
* Expira en 2 horas
* Multiuso hasta expiración

---

# 22. SessionLink Handling

---

Reglas:

* Acceso solo desde enlace
* No visible en navegación pública
* Valida duración dinámica

---

# 22.1 Flujo de generación de SessionLink desde admin panel

---

Al generar un SessionLink desde `WeeklyAgenda` (DetailPanel):

1. Admin rellena duración y notas opcionales en la view `session-link-form`
2. `POST /api/admin/session-links` crea el link en DB y envía el email automáticamente al cliente
3. La view cambia a `session-link-result`, que muestra confirmación de email enviado (icono check + texto)
4. El admin NO ve ni copia la URL — el token nunca se expone en la UI del admin
5. El cliente recibe el email con el link correcto (`/session-link/:token`)

---

# 23. Admin Panel Rules

---

Reglas:

* Protegido por Better Auth
* Todo cambio auditado
* No acceso sin sesión

---

# 24. Styling Rules

---

Obligatorio:

* TailwindCSS
* Tokens de UI-001
* No CSS arbitrario

---

Prohibido:

* inline styles
* estilos hardcodeados
* librerías CSS externas

---

# 25. Component Rules

---

Todo componente debe:

* ser reutilizable
* tener props tipadas
* no contener lógica de negocio pesada

---

# 26. Naming Conventions

---

Componentes:

PascalCase

---

Hooks:

useXxx

---

Functions:

camelCase

---

Files:

kebab-case

---

# 27. Testing Strategy (Frontend)

---

Se definirá en TEST-001, pero frontend debe soportar:

* unit tests
* integration tests
* e2e tests

---

# 28. Build Rules

---

* No build warnings permitidos
* TypeScript strict obligatorio
* ESLint obligatorio

---

# 29. Golden Rule

---

El frontend nunca contiene lógica de negocio crítica.

Todo comportamiento importante vive en backend o API layer.
