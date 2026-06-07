import { describe, it, expect, beforeEach } from "vitest"
import { validateEnv } from "@/lib/env"

// ─── Helper para manipular process.env de forma segura ───────────────────────
function withEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {}

  // Guardar valores originales y aplicar overrides
  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = process.env[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    fn()
  } finally {
    // Restaurar valores originales
    for (const [key, original] of Object.entries(saved)) {
      if (original === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original
      }
    }
  }
}

describe("env validation", () => {
  // El setup de vitest (vitest.setup.ts) garantiza que process.env
  // tiene valores válidos antes de cada test.

  // ─── DATABASE_URL ───────────────────────────────────────────────────────────

  it("lanza error si DATABASE_URL está vacía", () => {
    withEnv({ DATABASE_URL: "" }, () => {
      expect(() => validateEnv()).toThrow("DATABASE_URL es requerida")
    })
  })

  it("lanza error si DATABASE_URL no está definida", () => {
    withEnv({ DATABASE_URL: undefined }, () => {
      expect(() => validateEnv()).toThrow("DATABASE_URL")
    })
  })

  // ─── DIRECT_URL ────────────────────────────────────────────────────────────

  it("lanza error si DIRECT_URL está vacía", () => {
    withEnv({ DIRECT_URL: "" }, () => {
      expect(() => validateEnv()).toThrow("DIRECT_URL es requerida para migraciones Prisma")
    })
  })

  // ─── BETTER_AUTH_SECRET ─────────────────────────────────────────────────────

  it("lanza error si BETTER_AUTH_SECRET tiene menos de 32 caracteres", () => {
    withEnv({ BETTER_AUTH_SECRET: "short-secret" }, () => {
      expect(() => validateEnv()).toThrow("BETTER_AUTH_SECRET debe tener al menos 32 caracteres")
    })
  })

  it("lanza error si BETTER_AUTH_SECRET tiene exactamente 31 caracteres", () => {
    withEnv({ BETTER_AUTH_SECRET: "a".repeat(31) }, () => {
      expect(() => validateEnv()).toThrow("BETTER_AUTH_SECRET")
    })
  })

  it("acepta BETTER_AUTH_SECRET con exactamente 32 caracteres", () => {
    withEnv({ BETTER_AUTH_SECRET: "a".repeat(32) }, () => {
      expect(() => validateEnv()).not.toThrow()
    })
  })

  // ─── STRIPE ─────────────────────────────────────────────────────────────────

  it("lanza error si STRIPE_SECRET_KEY no empieza con 'sk_'", () => {
    withEnv({ STRIPE_SECRET_KEY: "pk_test_invalid" }, () => {
      expect(() => validateEnv()).toThrow("STRIPE_SECRET_KEY debe empezar con 'sk_'")
    })
  })

  it("lanza error si STRIPE_WEBHOOK_SECRET no empieza con 'whsec_'", () => {
    withEnv({ STRIPE_WEBHOOK_SECRET: "invalid_secret" }, () => {
      expect(() => validateEnv()).toThrow("STRIPE_WEBHOOK_SECRET debe empezar con 'whsec_'")
    })
  })

  // ─── RESEND ─────────────────────────────────────────────────────────────────

  it("lanza error si RESEND_API_KEY no empieza con 're_'", () => {
    withEnv({ RESEND_API_KEY: "invalid_key" }, () => {
      expect(() => validateEnv()).toThrow("RESEND_API_KEY debe empezar con 're_'")
    })
  })

  it("lanza error si RESEND_FROM_EMAIL no es un email válido", () => {
    withEnv({ RESEND_FROM_EMAIL: "not-an-email" }, () => {
      expect(() => validateEnv()).toThrow("RESEND_FROM_EMAIL debe ser un email válido")
    })
  })

  // ─── SUPABASE / BETTER AUTH URLs ────────────────────────────────────────────

  it("lanza error si SUPABASE_URL no es una URL válida", () => {
    withEnv({ SUPABASE_URL: "not-a-url" }, () => {
      expect(() => validateEnv()).toThrow("SUPABASE_URL debe ser una URL válida")
    })
  })

  it("lanza error si BETTER_AUTH_URL no es una URL válida", () => {
    withEnv({ BETTER_AUTH_URL: "not-a-url" }, () => {
      expect(() => validateEnv()).toThrow("BETTER_AUTH_URL debe ser una URL válida")
    })
  })

  // ─── Variables opcionales ───────────────────────────────────────────────────

  it("no lanza error si SENTRY_DSN no está definido (es opcional)", () => {
    withEnv({ SENTRY_DSN: undefined }, () => {
      expect(() => validateEnv()).not.toThrow()
    })
  })

  it("no lanza error si SENTRY_AUTH_TOKEN no está definido (es opcional)", () => {
    withEnv({ SENTRY_AUTH_TOKEN: undefined }, () => {
      expect(() => validateEnv()).not.toThrow()
    })
  })

  it("no lanza error si CRON_SECRET no está definido (es opcional)", () => {
    withEnv({ CRON_SECRET: undefined }, () => {
      expect(() => validateEnv()).not.toThrow()
    })
  })

  // ─── Test de éxito completo ─────────────────────────────────────────────────

  it("acepta todas las variables válidas sin lanzar error", () => {
    expect(() => validateEnv()).not.toThrow()
  })

  // ─── Calidad del mensaje de error ───────────────────────────────────────────

  it("el mensaje de error incluye el nombre de la variable y la descripción", () => {
    let errorMessage = ""
    withEnv({ DATABASE_URL: "" }, () => {
      try {
        validateEnv()
      } catch (e) {
        errorMessage = (e as Error).message
      }
    })
    expect(errorMessage).toContain("DATABASE_URL")
    expect(errorMessage).toContain("Variables de entorno inválidas o faltantes")
  })

  it("el mensaje de error menciona ENV-001 para orientar al desarrollador", () => {
    let errorMessage = ""
    withEnv({ DATABASE_URL: "" }, () => {
      try {
        validateEnv()
      } catch (e) {
        errorMessage = (e as Error).message
      }
    })
    expect(errorMessage).toContain("ENV-001")
  })

  // ─── NODE_ENV ───────────────────────────────────────────────────────────────

  it("acepta NODE_ENV=test", () => {
    withEnv({ NODE_ENV: "test" }, () => {
      expect(() => validateEnv()).not.toThrow()
    })
  })

  it("acepta NODE_ENV=development", () => {
    withEnv({ NODE_ENV: "development" }, () => {
      expect(() => validateEnv()).not.toThrow()
    })
  })

  it("acepta NODE_ENV=production", () => {
    withEnv({ NODE_ENV: "production" }, () => {
      expect(() => validateEnv()).not.toThrow()
    })
  })

  it("usa 'development' como valor por defecto para NODE_ENV", () => {
    withEnv({ NODE_ENV: undefined }, () => {
      const result = validateEnv() as { NODE_ENV: string }
      expect(result.NODE_ENV).toBe("development")
    })
  })
})
