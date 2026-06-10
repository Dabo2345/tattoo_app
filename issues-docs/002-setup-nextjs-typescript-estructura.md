# ISSUE #002 — Setup Next.js 15, TypeScript strict y estructura de carpetas

## Epic
EPIC 1 — System Foundation

## Type
Task

## Priority
P0

## Dependencies
- #001 — Repositorio y ramas configurados

---

## Contexto

El repositorio está vacío de código. Es necesario inicializar la aplicación Next.js 15 con la estructura de carpetas exacta definida en FRONT-001 y BACK-001, con TypeScript en modo strict y la configuración base del proyecto (package.json, tsconfig, ESLint, Prettier, Husky, Commitlint).

---

## Objetivo

Inicializar la aplicación Next.js 15 con toda la configuración base del proyecto: estructura de carpetas, TypeScript strict, herramientas de calidad de código y scripts de desarrollo.

---

## Scope

- Inicializar proyecto Next.js 15 con App Router usando `create-next-app`
- Configurar TypeScript en modo strict (`tsconfig.json`)
- Instalar y configurar ESLint con reglas del proyecto
- Instalar y configurar Prettier
- Instalar y configurar Husky + lint-staged (pre-commit hook)
- Instalar y configurar Commitlint (conventional commits)
- Crear estructura de carpetas completa de `/src` según FRONT-001 y BACK-001
- Configurar path aliases en `tsconfig.json` (`@/*`)
- Añadir todos los scripts necesarios en `package.json`
- Instalar pnpm como gestor de paquetes

---

## Anti-scope

- No instalar Tailwind ni Shadcn/UI (#006)
- No instalar Prisma ni conectar base de datos (#008, #009)
- No instalar Better Auth (#010)
- No escribir lógica de negocio
- No instalar Vitest ni Playwright (#003 incluye setup de CI, tests se configuran separado)

---

## Archivos afectados

```
package.json
pnpm-lock.yaml
tsconfig.json
next.config.ts
.eslintrc.json (o eslint.config.mjs)
.prettierrc
.prettierignore
.husky/
  pre-commit
.commitlintrc.json
lint-staged.config.js
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    (public)/
      layout.tsx
    admin/
      layout.tsx
      login/
        page.tsx
    api/
      .gitkeep
  modules/
    booking/.gitkeep
    calendar/.gitkeep
    payment/.gitkeep
    notification/.gitkeep
    gallery/.gitkeep
    content/.gitkeep
    auth/.gitkeep
    admin/.gitkeep
    audit/.gitkeep
  components/
    ui/.gitkeep
    layout/.gitkeep
    shared/.gitkeep
  lib/
    db/.gitkeep
    auth/.gitkeep
    api/.gitkeep
    stripe/.gitkeep
    resend/.gitkeep
    supabase/.gitkeep
    utils/.gitkeep
  hooks/.gitkeep
  schemas/.gitkeep
  types/
    index.ts
  styles/
    globals.css
tests/
  unit/.gitkeep
  integration/.gitkeep
  e2e/.gitkeep
prisma/
  schema.prisma (vacío por ahora)
public/
  .gitkeep
```

---

## Flujo de ejecución

1. Crear rama `feature/002-setup-nextjs` desde `develop`
2. Inicializar proyecto: `pnpm create next-app@latest . --typescript --tailwind=false --eslint --app --src-dir --import-alias "@/*"`
3. Configurar `tsconfig.json` con `strict: true` y paths
4. Instalar dependencias de desarrollo: `prettier`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`
5. Configurar `.prettierrc` con reglas del proyecto
6. Configurar ESLint (extender configuración de Next.js + TypeScript)
7. Inicializar Husky: `pnpm dlx husky init`
8. Configurar pre-commit hook con lint-staged
9. Configurar Commitlint
10. Crear estructura de carpetas vacías con `.gitkeep`
11. Añadir scripts a `package.json`
12. Verificar: `pnpm typecheck && pnpm lint && pnpm build`
13. Crear PR a `develop`

---

## Configuraciones exactas

### tsconfig.json (fragmento clave)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### .prettierrc

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### .commitlintrc.json

```json
{
  "extends": ["@commitlint/config-conventional"]
}
```

### Scripts en package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset"
  }
}
```

---

## Reglas del sistema aplicables

- STD-001: TypeScript strict mode obligatorio
- STD-001: pnpm como gestor de paquetes
- GOV-001: Conventional commits obligatorio (Commitlint)
- FRONT-001: Estructura de carpetas `/src/app`, `/src/modules`, `/src/components`, `/src/lib`
- BACK-001: Módulos en `/src/modules/[nombre]/services`, `/repositories`, `/schemas`, `/types`

---

## Criterios de aceptación

- [ ] `pnpm dev` arranca sin errores
- [ ] `pnpm build` completa sin errores
- [ ] `pnpm typecheck` pasa sin errores con `strict: true`
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm format:check` pasa sin diferencias
- [ ] El pre-commit hook rechaza commits con formato incorrecto
- [ ] El pre-commit hook rechaza commits que no siguen Conventional Commits
- [ ] La estructura de carpetas de `/src` existe con todos los módulos
- [ ] Los path aliases `@/*` funcionan correctamente

---

## Edge cases

- Si `create-next-app` instala Tailwind por defecto: remover y limpiar (se instala en #006)
- Si `strict: true` genera errores en el código generado por Next.js: ignorar con comentario o corregir
- Asegurar que `.husky/pre-commit` tiene permisos de ejecución (`chmod +x`)

---

## Tests requeridos

No aplica — esta issue es configuración base. La verificación es que los comandos de lint, typecheck y build pasen.

---

## Definition of Done

- [ ] `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint` todos pasan
- [ ] Husky pre-commit hook funciona
- [ ] Estructura de carpetas completa según FRONT-001 y BACK-001
- [ ] PR creado con CI verde
- [ ] Issue cerrada
