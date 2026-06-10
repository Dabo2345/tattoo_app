# ISSUE #010 — Better Auth: configuración, admin login y protección de rutas

## Epic
EPIC 2 — Database & Auth

## Type
Task

## Priority
P0

## Dependencies
- #009 — Supabase y Prisma conectados (Better Auth necesita DB)
- #007 — Layout base y rutas existen (para el redirect de auth)

---

## Contexto

El sistema tiene rutas `/admin/*` que necesitan estar protegidas. Los clientes no tienen cuentas — solo el administrador se autentica. Better Auth es la solución elegida en STD-001 para gestionar la sesión del admin. Esta issue configura Better Auth, crea la página de login funcional y protege todas las rutas admin mediante middleware de Next.js.

---

## Objetivo

Configurar Better Auth con Prisma adapter, crear la página de login del admin funcional (email + contraseña) y proteger todas las rutas `/admin/*` con el middleware de Next.js.

---

## Scope

- Instalar `better-auth` y su adapter de Prisma
- Configurar `/src/lib/auth/index.ts` con Better Auth + Prisma adapter
- Configurar las rutas de auth en Next.js (`/api/auth/[...all]`)
- Añadir los modelos de Better Auth al schema de Prisma (User, Session, Account, Verification)
- Aplicar migración con los nuevos modelos
- Crear el helper `withAdminAuth` para proteger Route Handlers
- Crear `/src/middleware.ts` que protege `/admin/*`
- Crear la página de login admin funcional (`/admin/login`) con el formulario real
- Crear script `db:create-admin` para crear el primer usuario administrador
- Configurar las reglas de sesión: duración 8 horas, HttpOnly, Secure

---

## Anti-scope

- No crear la UI completa del admin (Epic 6)
- No implementar otros métodos de auth (OAuth, magic links del admin)
- Los MagicLinks y SessionLinks de clientes son un sistema separado (#023, #024, #026)

---

## Archivos afectados

```
src/lib/auth/
  index.ts                    ← CREAR (configuración Better Auth)
  client.ts                   ← CREAR (cliente Better Auth para componentes)
src/app/
  api/
    auth/
      [...all]/
        route.ts              ← CREAR (handler de Better Auth)
  admin/
    login/
      page.tsx                ← MODIFICAR (formulario real)
src/middleware.ts             ← CREAR
prisma/schema.prisma          ← MODIFICAR (añadir modelos de Better Auth)
prisma/
  migrations/                 ← NUEVA MIGRACIÓN
scripts/
  create-admin.ts             ← CREAR
package.json                  ← MODIFICAR (añadir script db:create-admin)
```

---

## Flujo de ejecución

1. Crear rama `feature/010-better-auth` desde `develop`
2. Instalar: `pnpm add better-auth` y `pnpm add -D @better-auth/cli`
3. Añadir modelos de Better Auth al schema de Prisma:
   - Ejecutar: `pnpm dlx better-auth generate` para obtener el schema requerido
   - Integrar los modelos en `prisma/schema.prisma`
4. Aplicar migración: `pnpm db:migrate --name add-better-auth`
5. Crear `/src/lib/auth/index.ts` con la configuración
6. Crear `/src/lib/auth/client.ts` para componentes React
7. Crear el Route Handler `/api/auth/[...all]/route.ts`
8. Crear `/src/middleware.ts` para proteger `/admin/*`
9. Crear la página de login funcional
10. Crear `scripts/create-admin.ts`
11. Probar: login → dashboard → logout → redirect a /admin/login
12. Verificar que sin sesión, `/admin` redirige a `/admin/login`
13. `pnpm typecheck && pnpm lint && pnpm build`
14. Crear PR a `develop`

---

## Implementación

### /src/lib/auth/index.ts

```typescript
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
    expiresIn: 60 * 60 * 8,          // 8 horas en segundos
    updateAge: 60 * 60 * 1,          // Renovar sesión si falta menos de 1h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,                 // Cache de 5 min para reducir DB queries
    },
  },
  cookie: {
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,  // Admin se crea manualmente
  },
  rateLimit: {
    window: 15 * 60,                  // 15 minutos
    max: 5,                           // 5 intentos antes de bloquear
  },
})

export type Session = typeof auth.$Infer.Session
```

### /src/lib/auth/client.ts

```typescript
import { createAuthClient } from "better-auth/react"
import { env } from "@/lib/env"

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
})

export const { signIn, signOut, useSession } = authClient
```

### /src/app/api/auth/[...all]/route.ts

```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

### /src/middleware.ts

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  // Proteger todas las rutas /admin excepto /admin/login
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (request.nextUrl.pathname === "/admin/login") {
      // Si ya tiene sesión, redirigir al dashboard
      if (sessionCookie) {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      return NextResponse.next()
    }

    // Sin sesión → redirigir a login
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
```

### scripts/create-admin.ts

```typescript
import { prisma } from "../src/lib/db/prisma"
import { auth } from "../src/lib/auth"
import * as readline from "readline"

async function createAdmin() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const question = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve))

  const email = await question("Email del administrador: ")
  const password = await question("Contraseña (mín. 8 chars): ")
  const name = await question("Nombre: ")

  rl.close()

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    })
    console.log(`✅ Administrador creado: ${email}`)
  } catch (error) {
    console.error("❌ Error al crear administrador:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
```

---

## Reglas del sistema aplicables

- AUTH-001: Solo administrador tiene cuenta. Clientes no.
- AUTH-001: Sesión máxima 8 horas, timeout por inactividad 8 horas
- AUTH-001: Cookies HttpOnly, Secure en producción, SameSite=Lax
- AUTH-001: Máximo 5 intentos de login → bloqueo 15 minutos
- AUTH-001: SEC-001: Denegar por defecto — toda ruta admin explícitamente protegida

---

## Criterios de aceptación

- [ ] `pnpm db:migrate` aplica la migración de Better Auth sin errores
- [ ] `pnpm run db:create-admin` crea un usuario admin correctamente
- [ ] El formulario de login en `/admin/login` funciona con email + contraseña correctos
- [ ] Login incorrecto muestra mensaje de error apropiado
- [ ] Tras login exitoso, redirige a `/admin`
- [ ] Sin sesión, `/admin` redirige a `/admin/login`
- [ ] Sin sesión, `/admin/appointments` redirige a `/admin/login`
- [ ] Con sesión, `/admin/login` redirige a `/admin`
- [ ] Logout limpia la sesión y redirige a `/admin/login`
- [ ] `pnpm typecheck` pasa

---

## Edge cases

- Si `BETTER_AUTH_SECRET` cambia entre reinicios de servidor en dev: las sesiones existentes se invalidan (correcto)
- El middleware hace una verificación rápida de cookie (no DB) — la verificación real de sesión ocurre en los Route Handlers con `withAdminAuth`
- En CI, asegurar que los tests de integración no necesitan una sesión real de Better Auth (mockear la sesión)

---

## Tests requeridos

```typescript
// tests/integration/auth/middleware.test.ts
describe("Admin middleware protection", () => {
  it("redirige a /admin/login si no hay sesión", async () => {
    // Request a /admin sin cookie de sesión
    // Verificar redirect a /admin/login
  })

  it("permite acceso a /admin/login sin sesión", async () => {
    // Request a /admin/login sin cookie
    // Verificar que no hay redirect
  })

  it("redirige de /admin/login a /admin si ya hay sesión", async () => {
    // Request a /admin/login con cookie válida
    // Verificar redirect a /admin
  })
})
```

---

## Definition of Done

- [ ] Better Auth instalado y configurado con Prisma adapter
- [ ] Migración aplicada con modelos de Better Auth
- [ ] Login funcional en `/admin/login`
- [ ] Middleware protege todas las rutas `/admin/*`
- [ ] Script `db:create-admin` funciona
- [ ] Tests de middleware creados y pasando
- [ ] `pnpm build && pnpm typecheck` pasan
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
