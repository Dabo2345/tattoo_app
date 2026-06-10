# ISSUE #011 — API helpers: response factory, error handler y auth middleware

## Epic
EPIC 2 — Database & Auth

## Type
Task

## Priority
P0

## Dependencies
- #005 — Pino logger y Sentry disponibles
- #010 — Better Auth configurado (para withAdminAuth)

---

## Contexto

Todos los Route Handlers del sistema necesitan un patrón consistente para: devolver respuestas tipadas, capturar errores sin exponer detalles internos, y verificar sesión de admin. Sin estos helpers centralizados, cada handler implementaría su propia lógica de error de forma inconsistente. ERROR-001 y API-001 definen el contrato que estos helpers deben implementar.

---

## Objetivo

Crear la capa de utilidades de API: factory de respuestas tipadas, error handler centralizado, clases de error del dominio, middleware de autenticación y tipos base.

---

## Scope

- Crear `/src/lib/api/response.ts`: `createApiResponse` y `createApiError`
- Crear `/src/lib/api/errors.ts`: clases de error del dominio (BookingError, PaymentError, etc.)
- Crear `/src/lib/api/middleware.ts`: `withErrorHandler` y `withAdminAuth`
- Crear `/src/types/api.ts`: tipos TypeScript para respuestas de API
- Crear `/src/lib/db/prisma-errors.ts`: mapeo de errores de Prisma a errores del dominio

---

## Anti-scope

- No implementar rate limiting todavía (eso es #056)
- No crear los Route Handlers reales (EPIC 3 en adelante)
- No modificar la lógica de negocio

---

## Archivos afectados

```
src/lib/api/
  response.ts             ← CREAR
  errors.ts               ← CREAR
  middleware.ts           ← CREAR
src/lib/db/
  prisma-errors.ts        ← CREAR
src/types/
  api.ts                  ← CREAR
```

---

## Flujo de ejecución

1. Crear rama `feature/011-api-helpers` desde `develop`
2. Crear `/src/types/api.ts` con los tipos base
3. Crear `/src/lib/api/errors.ts` con las clases de error
4. Crear `/src/lib/api/response.ts` con las factories
5. Crear `/src/lib/db/prisma-errors.ts` con el mapeo
6. Crear `/src/lib/api/middleware.ts` con los wrappers
7. Escribir tests unitarios
8. `pnpm typecheck && pnpm lint`
9. Crear PR a `develop`

---

## Implementación

### /src/types/api.ts

```typescript
// Formato de respuesta exitosa (API-001)
export type ApiSuccess<T> = {
  success: true
  data: T
}

// Formato de respuesta de error (API-001)
export type ApiError = {
  success: false
  error: {
    code: ApiErrorCode
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// Códigos de error del sistema (API-001)
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SLOT_NOT_AVAILABLE"
  | "PAYMENT_FAILED"
  | "PAYMENT_REQUIRED"
  | "LINK_EXPIRED"
  | "LINK_ALREADY_USED"
  | "REFUND_FAILED"
  | "CONFLICT"
  | "INTERNAL_ERROR"

// Resultado de Server Actions (para componentes)
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
```

### /src/lib/api/errors.ts

```typescript
import type { ApiErrorCode } from "@/types/api"

/**
 * Error base del dominio. Todos los errores de negocio extienden esta clase.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = "DomainError"
  }
}

// ─── Errores de Booking ───────────────────────────────────────────────────────

export class SlotNotAvailableError extends DomainError {
  constructor() {
    super("SLOT_NOT_AVAILABLE", "El horario seleccionado ya no está disponible", 409)
    this.name = "SlotNotAvailableError"
  }
}

export class AppointmentNotFoundError extends DomainError {
  constructor() {
    super("NOT_FOUND", "La cita no existe", 404)
    this.name = "AppointmentNotFoundError"
  }
}

// ─── Errores de Links ─────────────────────────────────────────────────────────

export class LinkExpiredError extends DomainError {
  constructor() {
    super("LINK_EXPIRED", "El enlace ha expirado", 410)
    this.name = "LinkExpiredError"
  }
}

export class LinkAlreadyUsedError extends DomainError {
  constructor() {
    super("LINK_ALREADY_USED", "El enlace ya ha sido utilizado", 410)
    this.name = "LinkAlreadyUsedError"
  }
}

export class LinkNotFoundError extends DomainError {
  constructor() {
    super("LINK_EXPIRED", "El enlace no existe o ha expirado", 410)
    this.name = "LinkNotFoundError"
  }
}

// ─── Errores de Autenticación ─────────────────────────────────────────────────

export class UnauthorizedError extends DomainError {
  constructor() {
    super("UNAUTHORIZED", "No autorizado", 401)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends DomainError {
  constructor() {
    super("FORBIDDEN", "Sin permisos para esta acción", 403)
    this.name = "ForbiddenError"
  }
}

// ─── Errores de Pago ──────────────────────────────────────────────────────────

export class PaymentFailedError extends DomainError {
  constructor(message = "El pago no pudo procesarse") {
    super("PAYMENT_FAILED", message, 402)
    this.name = "PaymentFailedError"
  }
}

export class RefundFailedError extends DomainError {
  constructor() {
    super("REFUND_FAILED", "No se pudo procesar el reembolso", 500)
    this.name = "RefundFailedError"
  }
}

// ─── Error interno genérico ───────────────────────────────────────────────────

export class InternalError extends DomainError {
  constructor(message = "Error interno del servidor") {
    super("INTERNAL_ERROR", message, 500)
    this.name = "InternalError"
  }
}
```

### /src/lib/api/response.ts

```typescript
import { NextResponse } from "next/server"
import type { ApiErrorCode, ApiResponse } from "@/types/api"

/**
 * Crea una respuesta de éxito tipada según API-001.
 */
export function createApiResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Crea una respuesta de error tipada según API-001.
 * NUNCA expone detalles internos al cliente.
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  status: number = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}
```

### /src/lib/api/middleware.ts

```typescript
import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/sentry"
import { createApiError } from "./response"
import { DomainError, UnauthorizedError } from "./errors"
import { handlePrismaError } from "@/lib/db/prisma-errors"
import { Prisma } from "@prisma/client"

type RouteHandler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
type AuthenticatedRouteHandler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }, session: { user: { id: string; email: string } }) => Promise<NextResponse>

/**
 * Wrapper que captura errores y los convierte al formato API-001.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      return handleError(error)
    }
  }
}

/**
 * Wrapper que verifica sesión de admin antes de ejecutar el handler.
 */
export function withAdminAuth(handler: AuthenticatedRouteHandler): RouteHandler {
  return withErrorHandler(async (req, ctx) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new UnauthorizedError()
    }
    return handler(req, ctx, session)
  })
}

function handleError(error: unknown): NextResponse {
  // Error de validación Zod
  if (error instanceof ZodError) {
    const firstError = error.errors[0]
    return createApiError(
      "VALIDATION_ERROR",
      firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Datos inválidos",
      400
    )
  }

  // Error de dominio conocido (negocio)
  if (error instanceof DomainError) {
    if (error.statusCode >= 500) {
      logger.error({ error }, `Domain error: ${error.code}`)
      captureException(error)
    } else {
      logger.warn({ code: error.code }, `Business error: ${error.message}`)
    }
    return createApiError(error.code, error.message, error.statusCode)
  }

  // Error de Prisma → mapear a error de dominio
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const domainError = handlePrismaError(error)
    return createApiError(domainError.code, domainError.message, domainError.statusCode)
  }

  // Error inesperado → reportar a Sentry, respuesta genérica
  logger.error({ error }, "Unhandled error in route handler")
  captureException(error)
  return createApiError("INTERNAL_ERROR", "Error interno del servidor", 500)
}
```

### /src/lib/db/prisma-errors.ts

```typescript
import { Prisma } from "@prisma/client"
import { DomainError, InternalError } from "@/lib/api/errors"
import { logger } from "@/lib/logger"

export function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): DomainError {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      return new DomainError("CONFLICT", "El recurso ya existe", 409)
    case "P2025":
      // Record not found
      return new DomainError("NOT_FOUND", "Recurso no encontrado", 404)
    default:
      logger.error({ error, code: error.code }, "Unhandled Prisma error")
      return new InternalError("Error de base de datos")
  }
}
```

---

## Reglas del sistema aplicables

- API-001: Formato de respuesta `{ success, data }` o `{ success, error: { code, message } }`
- API-001: Todos los códigos de error definidos en este documento
- ERROR-001: Errores inesperados van a Sentry, errores de negocio solo a Pino warn
- AUTH-001: `withAdminAuth` verifica sesión de Better Auth en cada request admin
- BACK-001: Los handlers no contienen lógica de negocio, solo orquestan

---

## Criterios de aceptación

- [ ] `createApiResponse` devuelve `{ success: true, data: ... }` con el status correcto
- [ ] `createApiError` devuelve `{ success: false, error: { code, message } }` con el status correcto
- [ ] `withErrorHandler` captura ZodError y devuelve `VALIDATION_ERROR` con 400
- [ ] `withErrorHandler` captura DomainError y devuelve el código/status correcto
- [ ] `withErrorHandler` captura errores inesperados, los reporta a Sentry y devuelve `INTERNAL_ERROR` 500
- [ ] `withAdminAuth` devuelve `UNAUTHORIZED` 401 si no hay sesión
- [ ] `withAdminAuth` ejecuta el handler con la sesión si está autenticado
- [ ] `pnpm typecheck` pasa — los tipos son correctos y no hay `any`

---

## Edge cases

- Si Better Auth no responde (DB caída): `auth.api.getSession` lanza excepción → `withErrorHandler` la captura como INTERNAL_ERROR
- ZodError puede tener múltiples errores: mostrar solo el primero al cliente (los demás no se exponen)
- DomainError con status 5xx debe reportarse a Sentry además de loguearse

---

## Tests requeridos

```typescript
// tests/unit/lib/api/middleware.test.ts

describe("withErrorHandler", () => {
  it("captura ZodError y devuelve 400 VALIDATION_ERROR", async () => { ... })
  it("captura DomainError y devuelve el status correcto", async () => { ... })
  it("captura errores desconocidos y devuelve 500 INTERNAL_ERROR", async () => { ... })
  it("no expone detalles internos en errores 500", async () => { ... })
})

describe("createApiResponse", () => {
  it("devuelve { success: true, data } con status 200", () => { ... })
  it("devuelve status personalizado cuando se especifica", () => { ... })
})

describe("createApiError", () => {
  it("devuelve { success: false, error: { code, message } }", () => { ... })
})
```

---

## Definition of Done

- [ ] Todos los archivos de `/src/lib/api/` y `/src/lib/db/prisma-errors.ts` creados
- [ ] `/src/types/api.ts` creado con todos los tipos
- [ ] Tests unitarios creados y pasando
- [ ] `pnpm typecheck` pasa sin errores
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
