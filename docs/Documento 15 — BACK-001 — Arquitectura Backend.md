# BACK-001 — Arquitectura Backend

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-06

---

# 1. Principios

## BP-001

El backend es la única fuente de verdad para la lógica de negocio.

## BP-002

El frontend NUNCA contiene lógica de negocio crítica. Toda validación importante se duplica en el backend.

## BP-003

Stripe y Resend son únicamente accesibles desde el backend. Nunca desde el cliente.

## BP-004

Toda API pública valida sus entradas con Zod antes de cualquier procesamiento.

## BP-005

Todo acceso a base de datos ocurre a través de Prisma. Nunca con queries SQL crudas directamente.

## BP-006

Todo error del backend se loguea con Pino antes de ser devuelto al cliente.

---

# 2. Capas del backend

El backend se organiza en tres capas:

```
┌─────────────────────────────────────────┐
│         API Layer                        │
│   Route Handlers + Server Actions        │
│   Validación Zod + Auth check            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer                    │
│   Lógica de negocio                      │
│   Reglas del dominio (DATA-002)          │
│   Orquestación entre servicios           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Repository Layer                 │
│   Acceso a base de datos via Prisma      │
│   Integración con servicios externos     │
│   (Stripe, Resend, Supabase Storage)     │
└─────────────────────────────────────────┘
```

---

# 3. API Layer

## 3.1 Route Handlers

Usados para APIs públicas y webhooks.

Localización: `/src/app/api/`

```
/src/app/api/
├── availability/
│   └── route.ts          ← GET /api/availability
├── consultations/
│   └── route.ts          ← POST /api/consultations
├── appointments/
│   └── [id]/
│       ├── cancel/
│       │   └── route.ts  ← POST /api/appointments/:id/cancel
│       └── reschedule/
│           └── route.ts  ← POST /api/appointments/:id/reschedule
├── session-links/
│   └── [token]/
│       ├── route.ts      ← GET /api/session-links/:token
│       └── book/
│           └── route.ts  ← POST /api/session-links/:token/book
├── magic-links/
│   ├── request/
│   │   └── route.ts      ← POST /api/magic-links/request
│   └── [token]/
│       └── route.ts      ← GET /api/magic-links/:token
├── gallery/
│   ├── route.ts          ← GET /api/gallery
│   └── [id]/
│       └── route.ts      ← GET /api/gallery/:id
├── content/
│   ├── profile/route.ts  ← GET /api/content/profile
│   └── studio/route.ts   ← GET /api/content/studio
├── webhooks/
│   └── stripe/
│       └── route.ts      ← POST /api/webhooks/stripe
├── cron/
│   └── send-reminders/
│       └── route.ts      ← POST /api/cron/send-reminders (Bearer CRON_SECRET)
└── admin/
    ├── calendar/route.ts                         ← GET /api/admin/calendar
    ├── appointments/
    │   ├── route.ts                              ← GET /api/admin/appointments
    │   └── [id]/
    │       ├── cancel/route.ts                   ← POST /api/admin/appointments/:id/cancel
    │       └── reschedule/route.ts               ← POST /api/admin/appointments/:id/reschedule
    ├── blocked-periods/
    │   ├── route.ts                              ← GET/POST /api/admin/blocked-periods
    │   └── [id]/route.ts                         ← DELETE /api/admin/blocked-periods/:id
    └── session-links/route.ts                    ← POST /api/admin/session-links
```

## 3.2 Server Actions

Usados para operaciones del panel admin (formularios, uploads, configuración).

Localización: `/src/modules/[modulo]/actions.ts`

```
/src/modules/
├── gallery/
│   └── (las Server Actions de galería viven en /src/app/admin/gallery/actions.ts y delegan a gallery-service)
├── content/
│   └── actions.ts    ← updateArtistProfileAction, updateStudioInfoAction
└── admin/
    └── actions.ts    ← updateWorkingHoursAction, updateBreakTimesAction, updateDepositAmountAction
```

## 3.3 Patrón de un Route Handler

Estructura obligatoria:

```typescript
// Ejemplo de estructura — implementación definida en ISSUE DOC correspondiente
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createApiResponse, createApiError } from "@/lib/api/response"
import { withErrorHandler } from "@/lib/api/middleware"
import { someService } from "@/modules/[modulo]/services/some-service"

const bodySchema = z.object({
  // campos validados con Zod
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Validar body
  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return createApiError("VALIDATION_ERROR", parsed.error.message, 400)
  }

  // 2. Ejecutar lógica de negocio via Service
  const result = await someService.doAction(parsed.data)

  // 3. Devolver respuesta tipada
  return createApiResponse(result, 201)
})
```

## 3.4 Patrón de un Server Action

```typescript
"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { someService } from "@/modules/[modulo]/services/some-service"

const schema = z.object({
  // campos validados con Zod
})

export async function someAction(data: unknown) {
  // 1. Verificar sesión admin
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new Error("UNAUTHORIZED")
  }

  // 2. Validar entrada
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new Error("VALIDATION_ERROR")
  }

  // 3. Ejecutar via Service
  return await someService.doAction(parsed.data)
}
```

---

# 4. Service Layer

## 4.1 Responsabilidades

- Implementar las reglas de negocio de DATA-002
- Orquestar múltiples repositorios cuando sea necesario
- Coordinar notificaciones, pagos, y audit logs
- NO acceder directamente a Prisma (usar repositorios)
- NO tener conocimiento de HTTP o Next.js

## 4.2 Localización

```
/src/modules/[modulo]/services/
├── booking-service.ts
├── tattoo-plan-service.ts
├── availability-service.ts
├── payment-service.ts
├── notification-service.ts
└── ...
```

## 4.3 Patrón de un Service

```typescript
// Ejemplo de estructura
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { calendarRepository } from "@/modules/calendar/repositories/calendar-repository"
import { notificationService } from "@/modules/notification/services/notification-service"
import { auditService } from "@/modules/audit/services/audit-service"

export const bookingService = {
  async createConsultation(data: CreateConsultationInput) {
    // 1. Verificar disponibilidad (regla RB-012)
    const isAvailable = await calendarRepository.isSlotAvailable(data.startAt, data.endAt)
    if (!isAvailable) {
      throw new BookingError("SLOT_NOT_AVAILABLE")
    }

    // 2. Crear appointment en estado CONFIRMED (RB-NEW-001: sin pago previo)
    const appointment = await bookingRepository.createAppointment({
      ...data,
      status: "CONFIRMED",
    })

    // 3. Audit log (RB-020)
    await auditService.log("CONSULTATION_CREATED", appointment.id)

    // 4. Email de confirmación inmediato (RB-NEW-002)
    await notificationService.sendConsultationConfirmed(appointment.id)

    return { appointmentId: appointment.id }
  },
}
```

---

# 5. Repository Layer

## 5.1 Responsabilidades

- Acceso a base de datos via Prisma
- Transformación de datos de DB a tipos del dominio
- Integración directa con Stripe, Resend, Supabase Storage
- NO contienen lógica de negocio

## 5.2 Localización

```
/src/modules/[modulo]/repositories/
├── booking-repository.ts
├── client-repository.ts
├── payment-repository.ts
└── ...
```

## 5.3 Patrón de un Repository

```typescript
// Ejemplo de estructura
import { prisma } from "@/lib/db/prisma"
import type { Appointment, AppointmentStatus } from "@/modules/booking/types"

export const bookingRepository = {
  async findById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({ where: { id } })
  },

  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    return prisma.appointment.create({ data })
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return prisma.appointment.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })
  },
}
```

---

# 6. Módulos del backend

Cada módulo en `/src/modules/` tiene esta estructura interna:

```
/src/modules/[modulo]/
├── services/          ← Lógica de negocio
├── repositories/      ← Acceso a datos
├── schemas/           ← Validaciones Zod (compartidas con frontend)
├── types/             ← Tipos TypeScript del módulo
├── actions.ts         ← Server Actions (si aplica)
└── errors.ts          ← Errores específicos del módulo
```

## Módulos definidos

| Módulo | Responsabilidad |
|--------|----------------|
| `booking` | Consultations, TattooSessions, MagicLinks, SessionLinks, TattooPlans, cancelaciones, reprogramaciones |
| `calendar` | Slots, disponibilidad, descansos, BlockedPeriods |
| `payment` | Stripe checkout, webhooks, reembolsos |
| `notification` | Envío de emails via Resend, plantillas, triggers |
| `gallery` | Imágenes, StyleTags, ordenación, Supabase Storage — `gallery-service` (upload, softDelete, reorder) + `gallery-repository` (lectura pública, lectura admin, escritura) |
| `content` | Home, perfil artista, información estudio |
| `auth` | Integración Better Auth, sesiones admin |
| `admin` | Orquestación panel admin, configuración |
| `audit` | AuditLog, registro de acciones |

## Reglas de dependencia entre módulos

```
PERMITIDO:
  booking → calendar (consulta disponibilidad)
  booking → payment (crea checkout)
  booking → notification (dispara notificaciones)
  booking → audit (registra acciones)
  payment → audit (registra pagos)
  notification → audit (registra envíos)

PROHIBIDO:
  calendar → booking (el calendario no conoce las reservas)
  payment → booking (pagos no conocen la lógica de reserva)
  modules → modules internals (solo via servicios públicos)
```

---

# 7. Shared Library

Código compartido entre módulos que no pertenece a ninguno específico.

```
/src/lib/
├── db/
│   └── prisma.ts          ← Instancia singleton de Prisma Client
├── auth/
│   └── index.ts           ← Configuración y helpers de Better Auth
├── api/
│   ├── response.ts        ← createApiResponse, createApiError
│   ├── middleware.ts       ← withErrorHandler, withAuth, withAdminAuth
│   └── rate-limit.ts      ← Rate limiting helpers
├── stripe/
│   └── client.ts          ← Instancia Stripe (solo backend)
├── resend/
│   └── client.ts          ← Instancia Resend (solo backend)
├── supabase/
│   └── storage.ts         ← Cliente Supabase Storage (solo backend)
├── env.ts                 ← Validación de variables de entorno (Zod)
├── logger.ts              ← Instancia Pino configurada
└── utils/
    ├── tokens.ts           ← Generación de tokens seguros (crypto)
    ├── dates.ts            ← Helpers de fechas en UTC
    └── pagination.ts       ← Helpers de paginación
```

---

# 8. Middleware y protección de rutas

## 8.1 Middleware de Next.js

```
/src/middleware.ts
```

Responsabilidades:
- Proteger todas las rutas `/admin/*`
- Redirigir a `/admin/login` si no hay sesión válida
- No bloquear rutas públicas

## 8.2 Middleware de API

Helpers en `/src/lib/api/middleware.ts`:

```typescript
// withErrorHandler: captura errores y los loguea con Pino
// withAdminAuth: verifica sesión Better Auth + envuelve con withErrorHandler
// withRateLimit: aplica rate limiting por IP
```

### Patrón obligatorio para rutas admin (`/api/admin/*`)

Todos los Route Handlers admin deben usar `withAdminAuth` de `@/lib/api/middleware` (no de `@/lib/auth`). Este wrapper combina autenticación + manejo de errores y proporciona la sesión al handler:

```typescript
import { withAdminAuth } from "@/lib/api/middleware"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { createApiResponse } from "@/lib/api/response"

export const POST = withAdminAuth(
  async (request: NextRequest, ctx, session): Promise<NextResponse> => {
    const { id } = await ctx.params

    const entity = await bookingRepository.findAppointmentById(id)
    if (!entity) throw new AppointmentNotFoundError()

    await auditService.log("ACTION", id, {
      entityType: "Appointment",
      adminUserId: session.user.id,
      metadata: { ... }
    })

    return createApiResponse({ ... })
  }
)
```

Reglas:
- **NO** usar `withAdminAuth` de `@/lib/auth` (patrón obsoleto)
- **NO** llamar a `prisma` directamente en route handlers — usar repositorios
- **NO** usar `prisma.auditLog.create()` directamente — usar `auditService.log()`
- **NO** usar `Response.json({ success: false, ... })` para errores — lanzar excepciones (`throw new DomainError(...)`)
- **SÍ** usar `createApiResponse(data)` para respuestas de éxito

## 8.3 Rutas protegidas

| Ruta | Protección |
|------|-----------|
| `/admin/*` | Better Auth session (middleware) |
| `/api/admin/*` | Better Auth session (withAdminAuth) |
| `/api/webhooks/stripe` | Stripe signature (verificación interna) |
| Resto de `/api/*` | Pública (solo validación Zod) |

---

# 9. Logging con Pino

## 9.1 Configuración

Instancia en `/src/lib/logger.ts`:

```typescript
// Ejemplo de estructura
import pino from "pino"

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  // En producción: JSON estructurado para Sentry/observabilidad
  // En desarrollo: pretty print para legibilidad
})
```

## 9.2 Qué se loguea

| Nivel | Situación |
|-------|-----------|
| `info` | Consultation creada, payment confirmado, SessionLink generado, login exitoso |
| `warn` | Rate limit alcanzado, MagicLink expirado, slot no disponible |
| `error` | Error de Stripe, error de Resend, error de DB, excepción no controlada |
| `debug` | Solo en desarrollo — detalles de requests, queries |

## 9.3 Qué NUNCA se loguea

- Passwords o hashes de contraseñas
- Tokens en texto plano (MagicLink, SessionLink)
- Cookies de sesión
- Claves de API (Stripe, Resend)
- Datos completos de tarjetas

---

# 10. Manejo de errores

Ver ERROR-001 para la estrategia completa.

## Resumen de reglas

- Todo Route Handler está envuelto en `withErrorHandler`
- Los errores de Zod se convierten en `VALIDATION_ERROR` con 400
- Los errores de Prisma se mapean a códigos de error del sistema
- Los errores de Stripe se mapean a `PAYMENT_FAILED` o `REFUND_FAILED`
- Los errores inesperados devuelven `INTERNAL_ERROR` con 500 (sin detalles internos)
- Todo error con 500 se reporta a Sentry

---

# 11. Base de datos

## 11.1 Prisma Client

Un único cliente Prisma compartido como singleton:

```typescript
// /src/lib/db/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

## 11.2 Migraciones

- Las migraciones se generan con `prisma migrate dev`
- Se aplican en CI con `prisma migrate deploy`
- Nunca se editan migraciones ya generadas
- Toda migración destructiva requiere Issue de tipo `feat(db):`

## 11.3 Patrón: validación Zod al leer campos JSONB

Los campos JSONB de Prisma se exponen como `JsonValue` (sin tipo en tiempo de ejecución).
Nunca se deben castear directamente con `as unknown as T`. Se debe validar con Zod:

```typescript
// ✅ Correcto
const result = myArraySchema.safeParse(record.jsonbField ?? [])
if (!result.success) {
  logger.warn({ issues: result.error.issues }, "JSONB corrupto — usando fallback")
}
const value = result.success ? result.data : fallbackValue

// ❌ Prohibido
const value = record.jsonbField as unknown as MyType[]
```

El schema Zod usado para leer debe ser el mismo (o compatible) con el que valida las escrituras,
para garantizar consistencia. Exportar el schema desde el módulo que lo define para reutilizarlo.

## 11.3 Convenciones de schema

- Todos los IDs son UUIDs (`@id @default(uuid())`)
- Todos los modelos tienen `createdAt` y `updatedAt`
- Soft deletes via campo `deletedAt DateTime?`
- Todas las fechas en UTC
- Enums definidos en Prisma y reexportados como tipos TypeScript

---

# 12. Webhooks de Stripe

## Flujo obligatorio

```
Stripe → POST /api/webhooks/stripe
              ↓
         Verificar firma con STRIPE_WEBHOOK_SECRET
              ↓
         Si firma inválida → 400 (loguear intento)
              ↓
         Identificar tipo de evento
              ↓
         checkout.session.completed → confirmar appointment PENDING_PAYMENT legacy + notificación
                                      (nuevas consultas nacen CONFIRMED directamente — RB-NEW-001)
         charge.refunded → actualizar Payment a REFUNDED
         Evento desconocido → loguear + responder 200 (no rechazar)
              ↓
         Responder 200 rápido (< 30s o Stripe reintenta)
```

## Idempotencia

Los webhooks de Stripe pueden llegar duplicados. El handler debe ser idempotente: verificar el estado actual antes de modificar para evitar doble confirmación o doble reembolso.

---

# 13. Generación de tokens seguros

Todos los tokens (MagicLink, SessionLink) se generan con:

```typescript
// /src/lib/utils/tokens.ts
import crypto from "crypto"

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex") // 64 chars hex
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}
```

Reglas:
- El token original se envía al cliente (en URL)
- Solo el hash se almacena en la base de datos
- La búsqueda siempre es por hash, nunca por token original

---

# 14. Reglas de arquitectura backend

## BA-001

Un Route Handler no contiene lógica de negocio. Solo: validar entrada → llamar service → devolver respuesta.

## BA-002

Un Service no importa nada de `next/server` o `next/headers`. Es framework-agnostic.

## BA-003

Un Repository no contiene lógica de negocio. Solo operaciones CRUD y queries.

## BA-004

Stripe y Resend se instancian en `/src/lib/` y se importan desde los repositories o services que los necesiten.

## BA-005

Nunca se usan `any` tipos en el backend. TypeScript strict en todo momento.

## BA-006

Los errores de módulo son clases o tipos específicos, no strings genéricos.

---

# TattooPlanService — flujo de plan de tatuaje (#070)

## Crear plan (POST /api/admin/appointments/:id/tattoo-plan)

```
Admin solicita crear plan
  ↓
bookingRepository.findAppointmentById → verificar CONSULTATION + CONFIRMED (RB-TP-001)
  ↓
tattooPlanRepository.findByAppointmentId → verificar que no existe plan (RB-TP-002)
  ↓
tattooPlanRepository.create → crea TattooPlan (DRAFT) + TattooPlanSession[] en transacción
  ↓
Devuelve plan con sesiones
```

## Enviar plan al cliente (POST /api/admin/tattoo-plans/:planId/send)

```
Admin solicita envío
  ↓
tattooPlanRepository.findById → verificar plan existe y está en DRAFT (RB-TP-003)
  ↓
Por cada TattooPlanSession:
  bookingRepository.createSessionLink (expira 30 días — RB-TP-004)
  tattooPlanRepository.updateSessionLinkId → vincula SessionLink a sesión
  ↓
tattooPlanRepository.updatePlanStatus → SENT (RB-TP-005)
  ↓
auditService.log("TATTOO_PLAN_SENT")
  ↓
notificationService.sendTattooPlan (stub — implementación real en #073)
```

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `src/modules/booking/services/tattoo-plan-service.ts` | Lógica de negocio |
| `src/modules/booking/repositories/tattoo-plan-repository.ts` | Acceso a datos |
| `src/modules/booking/schemas/tattoo-plan-schema.ts` | Validación Zod |
| `src/modules/booking/types/tattoo-plan.ts` | Tipos TypeScript |
| `src/app/api/admin/appointments/[id]/tattoo-plan/route.ts` | GET + POST |
| `src/app/api/admin/tattoo-plans/[planId]/send/route.ts` | POST envío |
