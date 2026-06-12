# ISSUE #003 — GitHub Actions: CI workflow (lint, typecheck, test, build)

## Epic
EPIC 1 — System Foundation

## Type
Task

## Priority
P0

## Dependencies
- #001 — Repositorio y ramas configurados
- #002 — Next.js y estructura base instalados

---

## Contexto

Sin CI automatizado, cualquier error en lint, tipos o build puede llegar a `develop` o `main`. El CI es la barrera de calidad que garantiza que ningún PR con errores puede ser mergeado. Es obligatorio tenerlo desde el inicio antes de empezar a desarrollar features.

---

## Objetivo

Configurar GitHub Actions con el workflow de CI que se ejecuta en cada PR y cada push a `develop` o `main`. El CI debe validar: lint, typecheck, tests y build.

---

## Scope

- Crear workflow `ci.yml` que ejecuta: lint → typecheck → test → build
- Configurar el workflow para que se dispare en PRs y push a `develop`/`main`
- Configurar caché de pnpm para acelerar las ejecuciones
- Actualizar branch protection de `main` y `develop` para requerir CI verde
- Añadir badges de CI al README.md
- Crear el archivo de configuración de Vitest (`vitest.config.ts`)
- Crear el archivo de configuración de Playwright (`playwright.config.ts`)

---

## Anti-scope

- No crear workflow de deploy a staging (#003 es solo CI)
- No configurar deploy a producción
- No añadir E2E en este workflow (E2E requiere entorno staging completo)
- No instalar Vitest ni Playwright en el proyecto (son dependencias de #002 si no se hicieron, o se añaden aquí)

---

## Archivos afectados

```
.github/
  workflows/
    ci.yml
vitest.config.ts
playwright.config.ts
vitest.setup.ts
README.md (añadir badge de CI)
```

---

## Flujo de ejecución

1. Crear rama `feature/003-github-actions-ci` desde `develop`
2. Instalar dependencias de testing si no están: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`, `msw`
3. Crear `vitest.config.ts` con configuración de coverage
4. Crear `playwright.config.ts` básico apuntando a localhost:3000
5. Crear `vitest.setup.ts` para configuración global de tests
6. Crear `.github/workflows/ci.yml`
7. Añadir badge de CI al README.md
8. Actualizar branch protection rules en GitHub para requerir este CI
9. Probar que el workflow se dispara y pasa en un PR de prueba
10. Crear PR a `develop`

---

## Contenido de ci.yml

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Typecheck, Test & Build
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Run unit tests
        run: pnpm test:run
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          BETTER_AUTH_URL: ${{ secrets.BETTER_AUTH_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          RESEND_FROM_NAME: ${{ secrets.RESEND_FROM_NAME }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}

      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          BETTER_AUTH_URL: ${{ secrets.BETTER_AUTH_URL }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          RESEND_FROM_NAME: ${{ secrets.RESEND_FROM_NAME }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
          NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
```

## Contenido de vitest.config.ts

```typescript
import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
      exclude: [
        "node_modules/**",
        ".next/**",
        "src/app/**",       // UI pages no cuentan
        "src/components/**", // Componentes UI no cuentan
        "prisma/**",
        "tests/e2e/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
```

## Contenido de playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
      },
})
```

---

## Reglas del sistema aplicables

- DEVOPS-001: CI obligatorio en cada PR
- GOV-001: No merge sin CI verde
- TEST-001: Vitest para unit tests, Playwright para E2E
- GOV-001: Branch protection requiere CI checks

---

## Criterios de aceptación

- [ ] El workflow CI se dispara automáticamente en cada PR a `develop` y `main`
- [ ] El workflow ejecuta lint, typecheck, tests y build en ese orden
- [ ] Si lint falla, el workflow se detiene y el PR queda bloqueado
- [ ] Si typecheck falla, el workflow se detiene y el PR queda bloqueado
- [ ] Si build falla, el workflow se detiene y el PR queda bloqueado
- [ ] Branch protection de `main` requiere este CI check verde
- [ ] Branch protection de `develop` requiere este CI check verde
- [ ] El caché de pnpm funciona (segunda ejecución más rápida que la primera)
- [ ] `vitest.config.ts` existe con umbral de cobertura del 80%
- [ ] `playwright.config.ts` existe con configuración básica

---

## Edge cases

- Si los GitHub Secrets no están configurados: el CI falla en el step de tests/build. Configurar secrets ANTES de hacer este PR (ver ENV-001, sección "GitHub Secrets requeridos")
- Si `pnpm install --frozen-lockfile` falla: el `pnpm-lock.yaml` debe estar committed y actualizado
- `concurrency` con `cancel-in-progress: true` cancela runs anteriores del mismo workflow cuando llega uno nuevo (ahorra minutos de GitHub Actions)

---

## Tests requeridos

No aplica — esta issue configura el sistema de CI, no lógica de negocio. La verificación es que el workflow pasa en GitHub Actions.

---

## Definition of Done

- [ ] Workflow CI verde en GitHub Actions
- [ ] Branch protection actualizada en `main` y `develop`
- [ ] `vitest.config.ts` y `playwright.config.ts` creados
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
