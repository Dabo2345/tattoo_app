# ISSUE #005 — Setup Pino logger y cliente Sentry

## Epic
EPIC 1 — System Foundation

## Type
Task

## Priority
P0

## Dependencies
- #004 — Variables de entorno validadas (se necesita `env.SENTRY_DSN`)

---

## Contexto

Sin logging estructurado, los errores en producción son difíciles de diagnosticar. Pino es el logger elegido en STD-001 por su alto rendimiento y output JSON estructurado. Sentry captura excepciones no controladas y las envía a un dashboard centralizado. Ambos son infraestructura base que el resto del sistema depende.

---

## Objetivo

Configurar Pino como logger del sistema y Sentry para captura de errores no controlados. Ambos deben estar listos para ser importados por cualquier módulo.

---

## Scope

- Instalar `pino` y `pino-pretty` (dev)
- Crear `/src/lib/logger.ts` con instancia singleton de Pino
- Instalar `@sentry/nextjs`
- Crear `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Crear `/src/lib/sentry.ts` con función `captureException` centralizada
- Configurar `next.config.ts` con el wrapper de Sentry
- Crear función `captureException` que solo reporta en producción (no en tests)

---

## Anti-scope

- No crear middleware de logging de requests HTTP (eso va en #011 junto con los API helpers)
- No crear alertas o dashboards en Sentry (configuración en plataforma)
- No loguear datos sensibles (passwords, tokens, tarjetas) — regla AUTH-001

---

## Archivos afectados

```
src/lib/logger.ts           ← CREAR
src/lib/sentry.ts           ← CREAR
sentry.client.config.ts     ← CREAR
sentry.server.config.ts     ← CREAR
sentry.edge.config.ts       ← CREAR
next.config.ts              ← MODIFICAR (wrapper de Sentry)
package.json                ← MODIFICAR (añadir dependencias)
```

---

## Flujo de ejecución

1. Crear rama `feature/005-pino-sentry` desde `develop`
2. Instalar dependencias: `pnpm add pino @sentry/nextjs` y `pnpm add -D pino-pretty`
3. Crear `/src/lib/logger.ts`
4. Crear archivos de configuración de Sentry (`sentry.*.config.ts`)
5. Crear `/src/lib/sentry.ts` con `captureException`
6. Modificar `next.config.ts` para envolver con `withSentryConfig`
7. Verificar que `pnpm build` sigue pasando
8. Crear PR a `develop`

---

## Implementación

### /src/lib/logger.ts

```typescript
import pino from "pino"

const isDevelopment = process.env.NODE_ENV === "development"
const isTest = process.env.NODE_ENV === "test"

export const logger = pino({
  level: isTest ? "silent" : isDevelopment ? "debug" : "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // En producción: JSON estructurado para Sentry/Vercel logs
})

// Exportar niveles para uso tipado
export type Logger = typeof logger
```

### /src/lib/sentry.ts

```typescript
import * as Sentry from "@sentry/nextjs"

/**
 * Captura una excepción y la envía a Sentry.
 * Solo reporta en producción. En desarrollo y tests, loguea en consola.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    })
  } else {
    // En desarrollo: loguear para visibilidad sin enviar a Sentry
    console.error("[Sentry would capture]:", error, context ?? "")
  }
}

/**
 * Captura un mensaje de nivel error en Sentry.
 */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(message, {
      level: "error",
      extra: context,
    })
  }
}
```

### sentry.server.config.ts

```typescript
import * as Sentry from "@sentry/nextjs"
import { env } from "@/lib/env"

Sentry.init({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === "development",
  enabled: process.env.NODE_ENV === "production",
})
```

### sentry.client.config.ts

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === "development",
  enabled: process.env.NODE_ENV === "production",
})
```

### sentry.edge.config.ts

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
})
```

---

## Reglas del sistema aplicables

- STD-001: Pino como logger oficial
- STD-001: Sentry para monitorización de errores
- ERROR-001: `captureException` centralizada, solo en producción
- AUTH-001: Nunca loguear passwords, tokens, cookies ni datos de tarjetas

---

## Criterios de aceptación

- [ ] `import { logger } from "@/lib/logger"` funciona en cualquier módulo de servidor
- [ ] En `NODE_ENV=development`: logs con formato pretty y colores
- [ ] En `NODE_ENV=production`: logs en formato JSON estructurado
- [ ] En `NODE_ENV=test`: logs silenciados (nivel "silent")
- [ ] `captureException` existe en `/src/lib/sentry.ts` y solo reporta en producción
- [ ] `pnpm build` pasa con la configuración de Sentry
- [ ] Los archivos `sentry.*.config.ts` existen y están configurados

---

## Edge cases

- Si `SENTRY_DSN` no está en `.env.local` (opcional en desarrollo): Sentry init debe funcionar sin DSN (no reporta, no falla)
- En tests: `logger.level = "silent"` para no contaminar el output de test
- `withSentryConfig` en next.config puede añadir tiempo al build inicial: es esperado

---

## Tests requeridos

```typescript
// tests/unit/lib/logger.test.ts
describe("logger", () => {
  it("existe y tiene los métodos básicos", () => {
    expect(logger.info).toBeDefined()
    expect(logger.error).toBeDefined()
    expect(logger.warn).toBeDefined()
  })
})

// tests/unit/lib/sentry.test.ts
describe("captureException", () => {
  it("no llama a Sentry.captureException fuera de producción", () => {
    // Mock Sentry.captureException
    // Llamar captureException
    // Verificar que el mock no fue llamado
  })
})
```

---

## Definition of Done

- [ ] `pino` y `@sentry/nextjs` instalados
- [ ] `/src/lib/logger.ts` y `/src/lib/sentry.ts` creados
- [ ] Archivos de configuración de Sentry creados
- [ ] `pnpm build` pasa
- [ ] Tests básicos creados y pasando
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
