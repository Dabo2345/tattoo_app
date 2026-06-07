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
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL debe ser una URL válida"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY debe empezar con 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET debe empezar con 'whsec_'"),

  // Resend
  RESEND_API_KEY: z.string().startsWith("re_", "RESEND_API_KEY debe empezar con 're_'"),
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

// ─── Tipos exportados ────────────────────────────────────────────────────────

type EnvVars = z.infer<typeof serverSchema> & z.infer<typeof clientSchema>

// ─── Validación ──────────────────────────────────────────────────────────────

export function validateEnv() {
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
    const clientParsed = clientSchema.safeParse(process.env)
    if (!clientParsed.success) {
      const clientErrors = clientParsed.error.flatten().fieldErrors
      const clientErrorMessages = Object.entries(clientErrors)
        .map(([key, msgs]) => `  • ${key}: ${msgs?.join(", ")}`)
        .join("\n")
      throw new Error(
        `\n❌ Variables de entorno inválidas o faltantes:\n${clientErrorMessages}\n\nRevisa ENV-001 y tu archivo .env.local`
      )
    }
    return { ...parsed.data, ...clientParsed.data }
  }

  // En el cliente, solo validamos NEXT_PUBLIC_*
  const parsed = clientSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("Variables de entorno del cliente inválidas:", parsed.error.flatten())
  }
  return parsed.data ?? {}
}

export const env = validateEnv() as EnvVars
