# ISSUE #004 — Validación de variables de entorno con Zod (env.ts)

## Epic
EPIC 1 — System Foundation

## Type
Task

## Priority
P0

## Dependencies
- #002 — Next.js y estructura base (Zod debe estar instalado)

---

## Contexto

Sin validación de variables de entorno, la aplicación puede arrancar con variables faltantes y fallar en producción de forma silenciosa o con mensajes de error crípticos. El principio ENV-004 establece que la app debe fallar de forma explícita (fail-fast) si falta cualquier variable crítica, con un mensaje claro que indique cuál falta y por qué.

---

## Objetivo

Crear `/src/lib/env.ts` que valide todas las variables de entorno requeridas con Zod al arrancar la aplicación, lanzando un error descriptivo si alguna falta.

---

## Scope

- Instalar Zod si no está instalado
- Crear `/src/lib/env.ts` con esquema Zod completo para todas las variables de ENV-001
- Distinguir entre variables del servidor (privadas) y variables del cliente (`NEXT_PUBLIC_*`)
- Crear archivo `.env.example` si no existe (en esta issue se asegura que está correcto)
- Añadir validación de `DIRECT_URL` para migraciones Prisma
- Exportar el objeto `env` tipado para uso en el resto del código

---

## Anti-scope

- No conectar a la base de datos (eso es #009)
- No instalar clientes de Stripe, Resend, Supabase (issues posteriores)
- No modificar ninguna otra lógica de la aplicación

---

## Archivos afectados

```
src/lib/env.ts          ← CREAR
.env.example            ← VERIFICAR que está completo (de ENV-001)
```

---

## Flujo de ejecución

1. Crear rama `feature/004-env-validation` desde `develop`
2. Verificar que Zod está en las dependencias (`pnpm add zod` si no está)
3. Crear `/src/lib/env.ts` con el esquema completo
4. Importar `env` en `/src/app/layout.tsx` o en un punto de entrada para forzar la validación al arrancar
5. Probar que arrancar sin `.env.local` lanza error descriptivo
6. Probar que `.env.local` completo permite arrancar correctamente
7. Ejecutar `pnpm typecheck && pnpm lint`
8. Crear PR a `develop`

---

## Implementación exacta

### /src/lib/env.ts

```typescript
import { z } from "zod"

// ─── Variables del SERVIDOR (nunca al cliente) ───────────────────────────────

const serverSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerida"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL es requerida para migraciones Prisma"),

  // Supabase
  SUPABASE_URL: z.string().url("SUPABASE_URL debe ser una URL válida"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY es requerida"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY es requerida — NUNCA al cliente"),

  // Better Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL debe ser una URL válida"),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY debe empezar con 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET debe empezar con 'whsec_'"),

  // Resend
  RESEND_API_KEY: z
    .string()
    .startsWith("re_", "RESEND_API_KEY debe empezar con 're_'"),
  RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL debe ser un email válido"),
  RESEND_FROM_NAME: z.string().min(1, "RESEND_FROM_NAME es requerido"),

  // Sentry (opcional en desarrollo)
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().min(1, "CRON_SECRET es requerida").optional(),

  // Node
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

// ─── Variables del CLIENTE (NEXT_PUBLIC_*) ───────────────────────────────────

const clientSchema = z.object({
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("pk_", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY debe empezar con 'pk_'"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL debe ser una URL válida"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
})

// ─── Validación ──────────────────────────────────────────────────────────────

function validateEnv() {
  // En el servidor, validamos todas las variables
  if (typeof window === "undefined") {
    const parsed = serverSchema.safeParse(process.env)
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      const errorMessages = Object.entries(errors)
        .map(([key, msgs]) => `  • ${key}: ${msgs?.join(", ")}`)
        .join("\n")
      throw new Error(
        `\n❌ Variables de entorno inválidas o faltantes:\n${errorMessages}\n\nRevisa ENV-001 y tu archivo .env.local`
      )
    }
    return { ...parsed.data, ...clientSchema.parse(process.env) }
  }

  // En el cliente, solo validamos NEXT_PUBLIC_*
  const parsed = clientSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("Variables de entorno del cliente inválidas:", parsed.error.flatten())
  }
  return parsed.data ?? {}
}

export const env = validateEnv()
```

---

## Reglas del sistema aplicables

- ENV-001: Toda variable requerida debe estar documentada y validada
- ENV-004: La aplicación debe fallar rápido si falta alguna variable crítica
- ENV-005: Variables privadas nunca usan prefijo `NEXT_PUBLIC_`

---

## Criterios de aceptación

- [ ] `/src/lib/env.ts` existe y exporta el objeto `env` con tipos correctos
- [ ] Si falta `DATABASE_URL`, la app lanza error explícito con nombre de la variable y descripción
- [ ] Si falta `BETTER_AUTH_SECRET`, la app lanza error explícito
- [ ] Si `BETTER_AUTH_SECRET` tiene menos de 32 caracteres, la app lanza error
- [ ] Si falta `STRIPE_SECRET_KEY`, la app lanza error explícito
- [ ] Las variables `NEXT_PUBLIC_*` son accesibles desde componentes cliente
- [ ] `pnpm typecheck` pasa: el objeto `env` está completamente tipado
- [ ] El mensaje de error incluye el nombre de la variable y qué está mal

---

## Edge cases

- En el entorno de test (NODE_ENV=test): algunas variables pueden ser mocks, asegurar que el schema permite valores de test válidos
- En `typeof window !== "undefined"` (browser): solo validar `NEXT_PUBLIC_*`
- Variables opcionales (Sentry): no deben bloquear el arranque si no están configuradas

---

## Tests requeridos

```typescript
// tests/unit/lib/env.test.ts

describe("env validation", () => {
  it("lanza error si DATABASE_URL está vacío", () => {
    // Mock process.env sin DATABASE_URL
    // Verificar que lanza error con mensaje correcto
  })

  it("lanza error si BETTER_AUTH_SECRET tiene menos de 32 chars", () => {
    // Mock con secreto corto
    // Verificar mensaje de error específico
  })

  it("acepta variables válidas sin error", () => {
    // Mock con todas las variables correctas
    // Verificar que no lanza error
  })
})
```

---

## Definition of Done

- [ ] `/src/lib/env.ts` creado con esquema Zod completo
- [ ] Tests unitarios creados y pasando
- [ ] `pnpm typecheck` pasa
- [ ] Verificado manualmente que arrancar sin `.env.local` lanza error descriptivo
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
