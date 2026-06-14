# ENV-001 — Variables de Entorno y Configuración

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-06

---

# 1. Principios

## ENV-001

Ningún secreto se almacena en el repositorio. Nunca.

## ENV-002

Todo secreto vive en el gestor de secretos del entorno correspondiente (`.env.local` en desarrollo, GitHub Secrets en CI, Vercel en producción).

## ENV-003

El archivo `.env.example` en la raíz del repositorio documenta todas las variables requeridas con valores de ejemplo. Nunca contiene valores reales.

## ENV-004

Toda variable de entorno requerida que falte en tiempo de ejecución debe lanzar un error explícito al arrancar la aplicación (fail-fast).

## ENV-005

Las variables de entorno públicas (expuestas al cliente) deben usar el prefijo `NEXT_PUBLIC_`. Las variables privadas (solo servidor) nunca deben usar ese prefijo.

---

# 2. Archivos de configuración

## Estructura en el repositorio

```
/
├── .env.example          ← Plantilla pública (en git)
├── .env.local            ← Desarrollo local (en .gitignore)
├── .env.test             ← Testing local (en .gitignore)
└── .gitignore            ← Debe incluir .env*.local y .env.test
```

## Regla de .gitignore

El `.gitignore` debe contener:

```
.env*.local
.env.test
.env.production
.env.staging
```

---

# 3. Variables requeridas

## 3.1 Base de datos — Supabase / PostgreSQL

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `DATABASE_URL` | URL de conexión Prisma con pooling | `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Sí |
| `DIRECT_URL` | URL directa para migraciones Prisma | `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres` | Sí |

> `DATABASE_URL` usa pooling (puerto 6543) para el runtime.
> `DIRECT_URL` usa conexión directa (puerto 5432) para `prisma migrate`.

---

## 3.2 Supabase Storage

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `SUPABASE_URL` | URL pública del proyecto Supabase | `https://xxxxxxxxxxxx.supabase.co` | No (puede ser pública) |
| `SUPABASE_ANON_KEY` | Clave anónima (acceso público limitado) | `eyJhbGciOiJIUzI1Ni...` | No (puede ser pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (acceso total) | `eyJhbGciOiJIUzI1Ni...` | **Sí — nunca al cliente** |

> `SUPABASE_SERVICE_ROLE_KEY` solo se usa en Server Actions y Route Handlers.
> Nunca se expone al frontend.

---

## 3.3 Autenticación — Better Auth

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `BETTER_AUTH_SECRET` | Secreto de firma de sesiones (min 32 chars) | `a1b2c3d4e5f6...` (32+ chars random) | Sí |
| `BETTER_AUTH_URL` | URL base de la aplicación | `http://localhost:3000` (dev) / `https://tattoo.com` (prod) | No |

> Generar `BETTER_AUTH_SECRET` con: `openssl rand -base64 32`

---

## 3.4 Pagos — Stripe

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `STRIPE_SECRET_KEY` | Clave secreta de API Stripe | `sk_test_...` (test) / `sk_live_...` (prod) | **Sí — nunca al cliente** |
| `STRIPE_WEBHOOK_SECRET` | Secreto de verificación de webhooks | `whsec_...` | **Sí — nunca al cliente** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave publicable (frontend) | `pk_test_...` / `pk_live_...` | No (pública) |

> Obtener `STRIPE_WEBHOOK_SECRET` del Stripe Dashboard al registrar el endpoint de webhook.
> En desarrollo usar Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## 3.5 Email — Resend

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `RESEND_API_KEY` | Clave de API de Resend | `re_xxxxxxxxxxxxxxxxx` | **Sí — nunca al cliente** |
| `RESEND_FROM_EMAIL` | Dirección de email remitente | `estudio@dominio.com` | No |
| `RESEND_FROM_NAME` | Nombre del remitente | `Estudio de Tatuajes` | No |

> El dominio de `RESEND_FROM_EMAIL` debe estar verificado en el dashboard de Resend.

---

## 3.6 Monitorización — Sentry

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `SENTRY_DSN` | Data Source Name del proyecto Sentry | `https://xxx@yyy.ingest.sentry.io/zzz` | No (puede ser pública) |
| `SENTRY_AUTH_TOKEN` | Token para upload de source maps en CI | `sntrys_...` | **Sí — solo CI** |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN expuesto al cliente para errores frontend | Mismo valor que `SENTRY_DSN` | No (pública) |

---

## 3.7 Aplicación — General

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación | `http://localhost:3000` (dev) / `https://tattoo.com` (prod) | No |
| `NODE_ENV` | Entorno de ejecución | `development` / `test` / `production` | No |

---

## 3.8 Cron Jobs

| Variable | Descripción | Ejemplo | Privada |
|----------|-------------|---------|---------|
| `CRON_SECRET` | Token Bearer para autenticar el endpoint `/api/cron/send-reminders` | `openssl rand -hex 32` | **Sí — solo backend** |

> Si `CRON_SECRET` no está definido, el endpoint `/api/cron/send-reminders` responde 503 y queda desactivado.
> Generar con: `openssl rand -hex 32`

---

# 4. Archivo .env.example

Este es el archivo exacto que debe existir en la raíz del repositorio:

```bash
# ============================================================
# ENV-001 — Variables de Entorno
# ============================================================
# Copia este archivo como .env.local para desarrollo local.
# NUNCA pongas valores reales en este archivo.
# ============================================================

# ------------------------------------------------------------
# BASE DE DATOS — Supabase / PostgreSQL
# ------------------------------------------------------------
# URL con pooling para runtime (puerto 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL directa para migraciones Prisma (puerto 5432)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# ------------------------------------------------------------
# SUPABASE STORAGE
# ------------------------------------------------------------
SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example"

# ------------------------------------------------------------
# AUTENTICACIÓN — Better Auth
# ------------------------------------------------------------
# Generar con: openssl rand -base64 32
BETTER_AUTH_SECRET="your-32-character-minimum-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# ------------------------------------------------------------
# PAGOS — Stripe
# ------------------------------------------------------------
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ------------------------------------------------------------
# EMAIL — Resend
# ------------------------------------------------------------
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="estudio@tudominio.com"
RESEND_FROM_NAME="Estudio de Tatuajes"

# ------------------------------------------------------------
# MONITORIZACIÓN — Sentry
# ------------------------------------------------------------
SENTRY_DSN="https://xxxxxx@xxxxxx.ingest.sentry.io/xxxxxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxxx@xxxxxx.ingest.sentry.io/xxxxxx"
# Solo necesario en CI para upload de source maps
SENTRY_AUTH_TOKEN="sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ------------------------------------------------------------
# APLICACIÓN
# ------------------------------------------------------------
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ------------------------------------------------------------
# CRON JOBS
# ------------------------------------------------------------
# Token Bearer para autenticar /api/cron/send-reminders
# Generar con: openssl rand -hex 32
CRON_SECRET="your-cron-secret-here"
```

---

# 5. Variables por entorno

## Development (local)

Archivo: `.env.local`

- Usar claves de test de Stripe (`sk_test_`, `pk_test_`)
- Supabase proyecto de desarrollo
- Better Auth URL: `http://localhost:3000`
- Resend con dominio de test o sandbox

## Test (CI / local)

Archivo: `.env.test`

- `DATABASE_URL` apunta a base de datos de test (puede ser la misma de dev con schema diferente)
- Variables de Stripe: usar `sk_test_` con tarjetas de test
- Resend: modo test (sin envío real de emails, usar mock en tests con MSW)
- Sentry: puede estar vacío en tests

## Staging

Configurado en: Vercel (proyecto de staging)

- Supabase proyecto separado para staging
- Stripe claves de test
- Resend dominio verificado de staging
- Better Auth URL: URL de staging en Vercel

## Production

Configurado en: Vercel (proyecto de producción)

- Supabase proyecto de producción
- Stripe claves live (`sk_live_`, `pk_live_`)
- Resend dominio de producción verificado
- Better Auth URL: URL de producción real

---

# 6. Gestión de secretos en CI/CD

## GitHub Secrets requeridos

Ir a: `Repositorio → Settings → Secrets and variables → Actions`

Crear los siguientes secrets:

| Secret | Descripción |
|--------|-------------|
| `DATABASE_URL` | URL PostgreSQL de staging |
| `DIRECT_URL` | URL directa PostgreSQL de staging |
| `SUPABASE_URL` | URL Supabase staging |
| `SUPABASE_ANON_KEY` | Clave anónima Supabase staging |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave servicio Supabase staging |
| `BETTER_AUTH_SECRET` | Secreto Better Auth staging |
| `STRIPE_SECRET_KEY` | Clave secreta Stripe (test para staging) |
| `STRIPE_WEBHOOK_SECRET` | Secreto webhook Stripe staging |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública Stripe (test) |
| `RESEND_API_KEY` | Clave API Resend |
| `RESEND_FROM_EMAIL` | Email remitente |
| `RESEND_FROM_NAME` | Nombre remitente |
| `SENTRY_DSN` | DSN Sentry |
| `SENTRY_AUTH_TOKEN` | Token Sentry para source maps |
| `NEXT_PUBLIC_APP_URL` | URL de staging |
| `CRON_SECRET` | Token para autenticar endpoint de recordatorios |

---

# 7. Validación de variables en runtime

En `/src/lib/env.ts` debe existir un validador que falle rápido si falta alguna variable:

```typescript
// Ejemplo de estructura — implementación definida en ISSUE DOC correspondiente
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  NODE_ENV: z.enum(["development", "test", "production"]),
})

export const env = envSchema.parse(process.env)
```

Si alguna variable falta, la aplicación lanza error en el arranque con mensaje claro.

---

# 8. Seguridad

## Variables que NUNCA deben llegar al cliente

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `BETTER_AUTH_SECRET`
- `SENTRY_AUTH_TOKEN`

## Revisión de seguridad

Antes de cada PR que modifique env.ts o .env.example:

- Verificar que ninguna clave secreta usa prefijo `NEXT_PUBLIC_`
- Verificar que .env.example no contiene valores reales
- Verificar que el nuevo secreto está documentado en este documento

---

# 9. Rotación de secretos

| Secreto | Frecuencia recomendada | Procedimiento |
|---------|----------------------|---------------|
| `BETTER_AUTH_SECRET` | Anual o ante sospecha de compromiso | Regenerar + actualizar en todos los entornos + notificar a sesiones activas |
| `STRIPE_WEBHOOK_SECRET` | Al cambiar endpoint | Regenerar en Stripe Dashboard |
| `RESEND_API_KEY` | Semestral | Rotar en Resend Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Ante sospecha de compromiso | Regenerar en Supabase Dashboard |

---

# 10. Errores comunes

| Error | Causa probable | Solución |
|-------|---------------|---------|
| `Error: DATABASE_URL is required` | Falta variable en `.env.local` | Copiar `.env.example` a `.env.local` y rellenar |
| `Stripe signature invalid` | `STRIPE_WEBHOOK_SECRET` incorrecto | Verificar secreto en Stripe Dashboard |
| `Resend: Domain not verified` | Dominio de `RESEND_FROM_EMAIL` no verificado | Verificar dominio en Resend Dashboard |
| `Auth session invalid` | `BETTER_AUTH_SECRET` diferente entre reinicios | Usar un secreto fijo en `.env.local` |
| Migración Prisma falla | `DATABASE_URL` tiene pooling (pgbouncer) | Usar `DIRECT_URL` para migraciones |
