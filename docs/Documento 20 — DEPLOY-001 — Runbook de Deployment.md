# DEPLOY-001 — Runbook de Deployment

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-06

---

# 1. Principios

## DEP-001

Nunca se hace deployment manual a producción. Todo deployment pasa por CI/CD de GitHub Actions + Vercel.

## DEP-002

El único camino a producción es: PR aprobado → CI verde → merge a `main` → Vercel deploy automático.

## DEP-003

Las migraciones de base de datos se aplican antes del deployment del frontend, nunca después.

## DEP-004

Toda producción tiene una estrategia de rollback documentada y probada.

---

# 2. Arquitectura de entornos

| Entorno | Rama git | Plataforma | Base de datos | URL |
|---------|----------|-----------|---------------|-----|
| Development | local | Local | Supabase (proyecto dev) | localhost:3000 |
| Staging | `develop` | Vercel (preview) | Supabase (proyecto staging) | staging.tattoo.com |
| Production | `main` | Vercel (production) | Supabase (proyecto production) | tattoo.com |

> Cada entorno tiene su propio proyecto de Supabase. NUNCA se comparten bases de datos entre entornos.

---

# 3. Setup inicial (primera vez)

## 3.1 Crear proyectos en Supabase

Crear dos proyectos en [supabase.com](https://supabase.com):

1. `tattoo-staging` — Para el entorno de staging
2. `tattoo-production` — Para producción

Anotar para cada uno:
- Project URL
- Anon Key
- Service Role Key
- Database connection strings (con y sin pooling)

## 3.2 Crear proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → New Project
2. Importar el repositorio de GitHub
3. Configurar:
   - Framework Preset: Next.js
   - Root Directory: `/` (raíz del repositorio)
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`

## 3.3 Configurar entornos en Vercel

En Vercel → Project Settings → Environment Variables:

Crear dos conjuntos de variables:
- **Production** (rama `main`)
- **Preview** (rama `develop` y otros previews)

Añadir todas las variables de ENV-001 para cada entorno.

> En Vercel puedes especificar qué variables aplican a Production, Preview, o Development.

## 3.4 Configurar dominio personalizado en Vercel

1. Vercel → Project → Settings → Domains
2. Añadir dominio de producción
3. Configurar DNS según instrucciones de Vercel
4. SSL automático (Let's Encrypt via Vercel)

## 3.5 Configurar GitHub Secrets

Ir a: GitHub → Repositorio → Settings → Secrets and variables → Actions

Añadir todos los secrets definidos en ENV-001 sección "GitHub Secrets requeridos".

## 3.6 Configurar webhooks de Stripe por entorno

**Staging:**
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://staging.tattoo.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`
4. Copiar el webhook secret → añadir a variables de Vercel (Preview)

**Production:**
1. Mismo proceso con URL de producción
2. Copiar el webhook secret → añadir a variables de Vercel (Production)

## 3.7 Configurar dominio en Resend

1. Resend Dashboard → Domains → Add Domain
2. Añadir el dominio de producción (ej: `tattoo.com`)
3. Configurar registros DNS (SPF, DKIM, DMARC) según instrucciones de Resend
4. Verificar dominio

## 3.8 Configurar Sentry

1. Sentry → New Project → Next.js
2. Copiar DSN → añadir a variables de Vercel
3. Sentry → Settings → Auth Tokens → Create token
4. Añadir token como `SENTRY_AUTH_TOKEN` en GitHub Secrets (para upload de source maps en CI)

## 3.9 Primera migración de base de datos

Aplicar el schema inicial a los proyectos de Supabase:

```bash
# Para staging
DATABASE_URL="[url-staging]" DIRECT_URL="[direct-url-staging]" pnpm db:migrate:prod

# Para production
DATABASE_URL="[url-production]" DIRECT_URL="[direct-url-production]" pnpm db:migrate:prod
```

---

# 4. Flujo normal de deployment

## 4.1 Staging (automático)

```
PR mergeado a develop
        ↓
GitHub Actions: ci.yml ejecuta
  - lint + typecheck
  - unit tests
  - integration tests
  - build
        ↓
Si todo verde → Vercel detecta push a develop
        ↓
Vercel: prisma migrate deploy (staging DB)
        ↓
Vercel: next build + deploy a staging
        ↓
GitHub Actions: deploy-staging.yml ejecuta
  - E2E tests contra staging
        ↓
Si E2E pasan → staging listo
```

## 4.2 Production (automático)

```
PR mergeado a main (solo desde develop)
        ↓
GitHub Actions: ci.yml ejecuta (igual que staging)
        ↓
Si todo verde → Vercel detecta push a main
        ↓
Vercel: prisma migrate deploy (production DB)
        ↓
Vercel: next build + deploy a production
        ↓
GitHub Actions: deploy-prod.yml ejecuta
  - smoke tests básicos
  - health check endpoints
        ↓
Si health check pasa → deployment completo
```

---

# 5. GitHub Actions workflows

## 5.1 ci.yml — Validación en PR

```yaml
# .github/workflows/ci.yml
# Ejecuta en cada PR y push a develop/main

name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:run
      - run: pnpm build
    env:
      # Variables necesarias para el build y tests
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      # ... resto de secrets
```

## 5.2 deploy-staging.yml — E2E en staging

```yaml
# .github/workflows/deploy-staging.yml
# Ejecuta E2E tras deploy exitoso a staging

name: E2E Staging

on:
  deployment_status:

jobs:
  e2e:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
    env:
      BASE_URL: ${{ secrets.STAGING_URL }}
```

## 5.3 deploy-prod.yml — Smoke tests en producción

```yaml
# .github/workflows/deploy-prod.yml
# Smoke tests básicos tras deploy a producción

name: Production Smoke Tests

on:
  deployment_status:

jobs:
  smoke:
    if: github.event.deployment_status.state == 'success' && github.event.deployment.environment == 'production'
    runs-on: ubuntu-latest
    steps:
      - name: Health check
        run: |
          curl -f ${{ secrets.PRODUCTION_URL }}/api/health || exit 1
      - name: Public gallery accessible
        run: |
          curl -f ${{ secrets.PRODUCTION_URL }}/api/gallery || exit 1
```

---

# 6. Migraciones de base de datos

## Reglas de migración

1. Nunca editar una migración ya aplicada en producción
2. Las migraciones destructivas (drop column, drop table) requieren:
   - Issue de tipo `feat(db):` con análisis de impacto
   - Migración en dos pasos: primero deprecar, luego eliminar en siguiente release
3. El orden de deployment es siempre: migración → código

## Comando de migración en producción

```bash
# En CI (usando DIRECT_URL, no pooled)
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
```

## Verificar migraciones pendientes

```bash
npx prisma migrate status
```

---

# 7. Rollback

## 7.1 Rollback de aplicación

Vercel guarda todos los deployments con posibilidad de promocionar cualquier versión anterior:

1. Vercel → Project → Deployments
2. Encontrar el último deployment estable
3. Click → "Promote to Production"

> El rollback de aplicación es instantáneo en Vercel.

## 7.2 Rollback de base de datos

Las migraciones de Prisma **no tienen rollback automático**. Estrategia:

1. Tener siempre un backup reciente (Supabase hace backups diarios automáticos)
2. Para migraciones destructivas: usar migraciones en dos fases
   - Fase 1: añadir nueva columna (backward compatible)
   - Fase 2: eliminar columna antigua (en siguiente release)
3. En caso de emergencia: restaurar backup de Supabase (RPO máximo 24h según ADR-001)

## 7.3 Cuándo hacer rollback

- Health check falla tras deployment
- Errores 5xx superan el 1% en los primeros 10 minutos
- Error crítico en el flujo de pago (Stripe)
- Fallo en la generación de MagicLinks o SessionLinks

---

# 8. Health checks

## Endpoint de salud

```
GET /api/health

Respuesta 200:
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-06-06T..."
}

Respuesta 500 si DB no responde:
{
  "status": "error",
  "db": "disconnected"
}
```

Este endpoint verifica que la base de datos es accesible y la aplicación está funcionando.

---

# 9. Variables de entorno en Vercel

## Cómo añadir una nueva variable

1. Vercel → Project → Settings → Environment Variables
2. Añadir variable con su valor para cada entorno (Production, Preview)
3. Hacer redeploy para que tome efecto (Vercel no aplica variables a deployments existentes)

## Cómo rotar un secreto en producción

1. Actualizar el secreto en el servicio externo (Stripe, Resend, etc.)
2. Actualizar en Vercel (Environment Variables)
3. Actualizar en GitHub Secrets
4. Trigger redeploy en Vercel

---

# 10. Checklist de deployment

### Antes de cada PR a main

- [ ] CI verde (lint, typecheck, tests, build)
- [ ] E2E pasan en staging
- [ ] No hay migraciones de DB destructivas sin análisis de impacto
- [ ] Las variables de entorno nuevas están configuradas en Vercel
- [ ] Los nuevos webhooks de Stripe están registrados

### Tras deployment a producción

- [ ] Health check responde 200
- [ ] Flujo de reserva funciona (test manual con tarjeta de test)
- [ ] Panel admin accesible
- [ ] Galería pública accesible
- [ ] Sentry no muestra errores nuevos en los primeros 10 minutos

---

# 11. Incidencias y soporte

## Ante un error en producción

1. Verificar Sentry para identificar el error
2. Verificar logs de Vercel (Project → Functions → Logs)
3. Si es crítico (booking roto, pagos fallando): rollback inmediato
4. Crear Issue de tipo `fix:` con el análisis del problema
5. Aplicar fix via PR normal con proceso completo

## Acceso a logs

- **Vercel logs**: Vercel Dashboard → Project → Functions
- **Sentry**: Dashboard de errores y performance
- **Supabase logs**: Supabase Dashboard → Logs Explorer
