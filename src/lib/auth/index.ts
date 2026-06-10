import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  session: {
    expiresIn: 60 * 60 * 8, // 8 horas
    updateAge: 60 * 60 * 1, // renovar si falta menos de 1h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // cache de 5 min para reducir DB queries
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // admin se crea manualmente
  },
  rateLimit: {
    window: 15 * 60, // 15 minutos
    max: 5, // 5 intentos antes de bloquear
  },
})

export type Session = typeof auth.$Infer.Session
// withAdminAuth para Route Handlers está en @/lib/api/middleware (#011)
