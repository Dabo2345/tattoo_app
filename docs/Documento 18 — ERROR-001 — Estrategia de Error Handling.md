# ERROR-001 — Estrategia de Error Handling

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-06

---

# 1. Principios

## EH-001

Los errores internos nunca se exponen al cliente. El cliente solo recibe un código de error semántico y un mensaje amigable.

## EH-002

Todo error inesperado (5xx) se reporta a Sentry automáticamente.

## EH-003

Los errores esperados (validación, slot ocupado, link expirado) son parte del flujo normal del sistema y no se reportan a Sentry.

## EH-004

El sistema es fail-fast en el arranque: si falta una variable de entorno o la DB no es accesible, la aplicación falla inmediatamente con mensaje claro (no en runtime).

## EH-005

Los errores de servicios externos (Stripe, Resend) no rompen el flujo principal si son no críticos. Se loguean y se continúa.

---

# 2. Clasificación de errores

## Nivel 1 — Errores de validación (cliente)

Causan respuesta 400. Son esperados. No se reportan a Sentry.

- Input inválido (Zod parse failed)
- Campo requerido ausente
- Formato incorrecto (email, fecha, UUID)

## Nivel 2 — Errores de negocio (cliente)

Causan respuesta 4xx específica. Son esperados. No se reportan a Sentry.

- Slot no disponible → 409
- MagicLink expirado → 410
- SessionLink ya usado → 410
- No autorizado → 401
- Sin permisos → 403
- Recurso no encontrado → 404
- Pago fallido → 402

## Nivel 3 — Errores de sistema (servidor)

Causan respuesta 500. Son inesperados. Se reportan a Sentry.

- Error de conexión a base de datos
- Error inesperado de Prisma
- Error inesperado de Stripe
- Excepción no controlada en un Service
- Error en proceso de build

---

# 3. Códigos de error del sistema

Definidos en API-001. Todos los errores de API usan este formato:

```json
{
  "success": false,
  "error": {
    "code": "SLOT_NOT_AVAILABLE",
    "message": "El horario seleccionado ya no está disponible"
  }
}
```

| Código | HTTP | Descripción |
|--------|------|-------------|
| `VALIDATION_ERROR` | 400 | Input inválido o campos incorrectos |
| `UNAUTHORIZED` | 401 | No autenticado |
| `FORBIDDEN` | 403 | Autenticado pero sin permisos |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `SLOT_NOT_AVAILABLE` | 409 | El slot ya está reservado |
| `CONFLICT` | 409 | Conflicto de estado genérico |
| `PAYMENT_REQUIRED` | 402 | Acción requiere pago |
| `PAYMENT_FAILED` | 402 | El pago fue rechazado |
| `LINK_EXPIRED` | 410 | El MagicLink o SessionLink ha expirado |
| `LINK_ALREADY_USED` | 410 | El SessionLink ya fue utilizado |
| `REFUND_FAILED` | 500 | Error al procesar reembolso en Stripe |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |

---

# 4. Error handling en Route Handlers

## 4.1 Wrapper obligatorio

Todo Route Handler debe usar `withErrorHandler`:

```typescript
// /src/lib/api/middleware.ts

import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/sentry"
import { createApiError } from "@/lib/api/response"

export function withErrorHandler(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: any): Promise<NextResponse> => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      return handleRouteError(error)
    }
  }
}

function handleRouteError(error: unknown): NextResponse {
  // Errores de validación Zod
  if (error instanceof ZodError) {
    return createApiError("VALIDATION_ERROR", "Datos inválidos", 400)
  }

  // Errores de negocio conocidos
  if (error instanceof BookingError) {
    return createApiError(error.code, error.message, error.statusCode)
  }

  // Errores inesperados → Sentry + respuesta genérica
  logger.error({ error }, "Unhandled error in route handler")
  captureException(error)
  return createApiError("INTERNAL_ERROR", "Error interno del servidor", 500)
}
```

## 4.2 Errores de dominio personalizados

Cada módulo define sus propios errores:

```typescript
// /src/modules/booking/errors.ts

export class BookingError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = "BookingError"
  }
}

export class SlotNotAvailableError extends BookingError {
  constructor() {
    super("SLOT_NOT_AVAILABLE", "El horario seleccionado ya no está disponible", 409)
  }
}

export class LinkExpiredError extends BookingError {
  constructor() {
    super("LINK_EXPIRED", "El enlace ha expirado", 410)
  }
}

export class LinkAlreadyUsedError extends BookingError {
  constructor() {
    super("LINK_ALREADY_USED", "El enlace ya ha sido utilizado", 410)
  }
}
```

---

# 5. Error handling en Server Actions

Los Server Actions usan un patrón de retorno explícito de errores (sin lanzar excepciones al cliente):

```typescript
"use server"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export async function uploadGalleryImageAction(
  formData: FormData
): Promise<ActionResult<{ imageId: string }>> {
  try {
    // ... lógica
    return { success: true, data: { imageId: "..." } }
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } }
    }
    // Errores inesperados
    logger.error({ error }, "Error in uploadGalleryImageAction")
    captureException(error)
    return { success: false, error: { code: "INTERNAL_ERROR", message: "Error al subir la imagen" } }
  }
}
```

---

# 6. Error handling en el frontend

## 6.1 Error Boundaries

Envolver secciones clave con Error Boundaries en el App Router:

```
/src/app/
├── error.tsx              ← Error boundary global
├── (public)/
│   ├── reservar/
│   │   └── error.tsx      ← Error boundary del flujo de reserva
└── admin/
    └── error.tsx          ← Error boundary del admin
```

Los Error Boundaries muestran mensajes amigables, nunca stack traces.

## 6.2 Mapeo de errores de API al usuario

```typescript
// /src/lib/api/error-messages.ts

const ERROR_MESSAGES: Record<string, string> = {
  SLOT_NOT_AVAILABLE: "Este horario ya no está disponible. Por favor elige otro.",
  LINK_EXPIRED: "El enlace ha expirado. Puedes solicitar uno nuevo.",
  LINK_ALREADY_USED: "Este enlace de sesión ya ha sido utilizado.",
  PAYMENT_FAILED: "El pago no pudo procesarse. Verifica tu tarjeta e inténtalo de nuevo.",
  INTERNAL_ERROR: "Ocurrió un error inesperado. Por favor inténtalo en unos minutos.",
  VALIDATION_ERROR: "Por favor revisa los datos introducidos.",
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Ha ocurrido un error. Por favor inténtalo de nuevo."
}
```

## 6.3 Estados de error en componentes

Todo componente que hace una petición debe manejar tres estados:

```tsx
// Estado de carga → mostrar skeleton o spinner
// Estado de éxito → mostrar resultado
// Estado de error → mostrar mensaje amigable + acción de recuperación

{isLoading && <LoadingSpinner />}
{isError && (
  <ErrorMessage
    message={getErrorMessage(error.code)}
    action={<Button onClick={retry}>Intentar de nuevo</Button>}
  />
)}
{isSuccess && <ResultComponent data={data} />}
```

---

# 7. Manejo de errores de Prisma

Los errores de Prisma deben mapearse antes de llegar al cliente:

```typescript
// /src/lib/db/prisma-errors.ts

import { Prisma } from "@prisma/client"

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        throw new ConflictError("El recurso ya existe")
      case "P2025":
        // Record not found
        throw new NotFoundError("Recurso no encontrado")
      default:
        logger.error({ error, code: error.code }, "Prisma known error")
        captureException(error)
        throw new InternalError("Error de base de datos")
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error({ error }, "Prisma unknown error")
    captureException(error)
    throw new InternalError("Error de base de datos desconocido")
  }

  throw error
}
```

---

# 8. Manejo de errores de Stripe

```typescript
// /src/lib/stripe/errors.ts

import Stripe from "stripe"

export function handleStripeError(error: unknown): never {
  if (error instanceof Stripe.errors.StripeError) {
    switch (error.type) {
      case "StripeCardError":
        throw new PaymentError("PAYMENT_FAILED", "El pago fue rechazado por el banco")
      case "StripeInvalidRequestError":
        logger.error({ error }, "Invalid Stripe request")
        throw new PaymentError("PAYMENT_FAILED", "Error en la solicitud de pago")
      case "StripeAPIError":
      case "StripeConnectionError":
        logger.error({ error }, "Stripe infrastructure error")
        captureException(error)
        throw new PaymentError("PAYMENT_FAILED", "El servicio de pago no está disponible")
      default:
        captureException(error)
        throw new InternalError("Error inesperado en el pago")
    }
  }
  throw error
}
```

---

# 9. Integración con Sentry

## 9.1 Configuración

Sentry se configura en:

```
/sentry.client.config.ts    ← Errores del cliente (browser)
/sentry.server.config.ts    ← Errores del servidor (Node.js)
/sentry.edge.config.ts      ← Errores en Edge Runtime
```

## 9.2 Función de captura

```typescript
// /src/lib/sentry.ts

import * as Sentry from "@sentry/nextjs"

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, { extra: context })
  } else {
    // En desarrollo, solo loguear en consola
    console.error("[Sentry would capture]:", error, context)
  }
}
```

## 9.3 Qué se reporta a Sentry

- Errores 5xx de Route Handlers
- Excepciones no capturadas en Server Actions
- Errores de Prisma (excepto P2002, P2025 que son esperados)
- Errores críticos de Stripe (StripeAPIError, StripeConnectionError)
- Fallos del cron job de recordatorios
- Errores en upload de imágenes a Supabase Storage

## 9.4 Qué NO se reporta a Sentry

- Errores de validación (400)
- Errores de negocio esperados (409, 410, 401, 403, 404)
- Errores de pago rechazado por el banco (StripeCardError)

---

# 10. Logging de errores con Pino

## Niveles de log para errores

```typescript
// Nivel warn: Errores esperados que merecen atención
logger.warn({ code: "SLOT_NOT_AVAILABLE", appointmentId }, "Booking attempt on unavailable slot")
logger.warn({ email, attempts }, "Rate limit reached for magic link request")

// Nivel error: Errores inesperados o críticos
logger.error({ error, appointmentId }, "Failed to send confirmation email")
logger.error({ error, paymentIntentId }, "Stripe webhook processing failed")
logger.error({ error }, "Database connection failed")
```

## Campos obligatorios en logs de error

```typescript
logger.error({
  error,           // El objeto de error completo
  // + contexto relevante:
  appointmentId,   // Si aplica
  userId,          // Si aplica (nunca email en crudo)
  action,          // Qué se intentaba hacer
}, "Mensaje descriptivo")
```

---

# 11. Checklist de error handling por feature

Al implementar una nueva feature, verificar:

- [ ] El Route Handler usa `withErrorHandler`
- [ ] Los errores de validación Zod devuelven `VALIDATION_ERROR` con 400
- [ ] Los errores de negocio usan clases de error específicas del módulo
- [ ] Los errores inesperados se reportan a Sentry
- [ ] Los errores de Prisma están mapeados con `handlePrismaError`
- [ ] El frontend maneja los tres estados: loading, success, error
- [ ] Los mensajes de error al usuario son en español y amigables
- [ ] Ningún stack trace ni mensaje técnico llega al cliente
- [ ] Los tests incluyen casos de error
