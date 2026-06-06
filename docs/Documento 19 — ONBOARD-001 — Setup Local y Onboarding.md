# ONBOARD-001 — Setup Local y Onboarding

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-06

---

# 1. Requisitos previos

Antes de empezar, verificar que tienes instalado:

| Herramienta | Versión mínima | Verificar con |
|-------------|---------------|---------------|
| Node.js | 20.x LTS | `node --version` |
| pnpm | 9.x | `pnpm --version` |
| Git | 2.x | `git --version` |
| VS Code (recomendado) | Cualquiera reciente | - |

## Instalar pnpm si no lo tienes

```bash
npm install -g pnpm
```

## Extensiones de VS Code recomendadas

Instalar el pack de extensiones del proyecto cuando VS Code lo sugiera al abrir el repositorio (definido en `.vscode/extensions.json`):

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- Error Lens

---

# 2. Clonar el repositorio

```bash
git clone https://github.com/[usuario]/tattoo_app.git
cd tattoo_app
```

---

# 3. Instalar dependencias

```bash
pnpm install
```

Esto instala todas las dependencias incluyendo Husky (git hooks) automáticamente.

---

# 4. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Abrir `.env.local` y rellenar todas las variables. Ver **ENV-001** para descripción detallada de cada variable.

### Variables mínimas para desarrollo local

Para el desarrollo local son necesarias como mínimo:

1. **Database** — Crear un proyecto en [Supabase](https://supabase.com) (plan free) y copiar las URLs de conexión
2. **Better Auth** — Generar un secreto: `openssl rand -base64 32`
3. **Stripe** — Crear cuenta en [Stripe](https://stripe.com), usar claves de TEST (`sk_test_*`, `pk_test_*`)
4. **Resend** — Crear cuenta en [Resend](https://resend.com), obtener API key y verificar un dominio
5. **Sentry** — Opcional en desarrollo local, dejar en blanco si no se quiere monitorización

---

# 5. Configurar la base de datos

## 5.1 Proyecto Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Anotar: URL del proyecto, Anon Key, Service Role Key
3. Ir a Project Settings → Database → Connection String
   - Copiar URI con **pgbouncer** (puerto 6543) → `DATABASE_URL`
   - Copiar URI **directa** (puerto 5432) → `DIRECT_URL`

## 5.2 Aplicar migraciones

```bash
pnpm db:migrate
```

Esto ejecuta `prisma migrate dev` y aplica todas las migraciones al schema de la base de datos.

## 5.3 Generar cliente Prisma

```bash
pnpm db:generate
```

> Si modificas el schema de Prisma debes regenerar el cliente.

## 5.4 Seed de datos de prueba (opcional)

```bash
pnpm db:seed
```

Crea datos de prueba: admin user, algunos appointments de ejemplo, imágenes de galería ficticias.

---

# 6. Configurar Stripe para desarrollo

## 6.1 Instalar Stripe CLI

Necesario para recibir webhooks en local.

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (con scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# O descargar desde: https://stripe.com/docs/stripe-cli
```

## 6.2 Autenticarse en Stripe CLI

```bash
stripe login
```

## 6.3 Escuchar webhooks en local

En una terminal separada, mientras desarrollas:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Stripe CLI imprimirá el `STRIPE_WEBHOOK_SECRET` que debes copiar a `.env.local`.

## 6.4 Tarjetas de test de Stripe

Para probar pagos sin dinero real:

| Situación | Número de tarjeta |
|-----------|------------------|
| Pago exitoso | `4242 4242 4242 4242` |
| Pago rechazado | `4000 0000 0000 0002` |
| Requiere autenticación 3DS | `4000 0025 0000 3155` |

CVV: cualquier 3 dígitos. Fecha: cualquiera futura.

---

# 7. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

# 8. Verificar que todo funciona

Después del setup inicial, verificar:

```bash
# TypeScript sin errores
pnpm typecheck

# Lint sin errores
pnpm lint

# Tests pasan
pnpm test

# Build exitoso
pnpm build
```

Si alguno de estos comandos falla, revisar la configuración antes de empezar a trabajar.

---

# 9. Acceso al panel de administración

Durante el desarrollo, el admin user se crea con el seed (`pnpm db:seed`) o manualmente en la base de datos.

URL: `http://localhost:3000/admin`

Para crear un admin user manualmente:

```bash
# Script de creación del primer admin
pnpm db:create-admin
```

> Esto pedirá email y contraseña en la terminal.

---

# 10. Scripts de desarrollo disponibles

```bash
# Desarrollo
pnpm dev              # Servidor Next.js en modo desarrollo
pnpm build            # Build de producción
pnpm start            # Servidor de producción (requiere build previo)

# Calidad de código
pnpm lint             # ESLint
pnpm lint:fix         # ESLint con auto-fix
pnpm typecheck        # TypeScript check sin emitir
pnpm format           # Prettier en todos los archivos
pnpm format:check     # Verificar formato sin modificar

# Base de datos
pnpm db:generate      # Generar cliente Prisma
pnpm db:migrate       # Aplicar migraciones (desarrollo)
pnpm db:migrate:prod  # Aplicar migraciones (producción, CI)
pnpm db:studio        # Abrir Prisma Studio (GUI)
pnpm db:seed          # Poblar con datos de prueba
pnpm db:reset         # Resetear DB y aplicar migraciones (¡destruye datos!)

# Testing
pnpm test             # Vitest en modo watch
pnpm test:run         # Vitest single run (CI)
pnpm test:coverage    # Coverage report
pnpm test:e2e         # Playwright E2E tests
pnpm test:e2e:ui      # Playwright con UI
```

---

# 11. Estructura del proyecto

```
tattoo_app/
├── CLAUDE.md                   ← Reglas de colaboración con IA
├── README.md                   ← Este archivo
├── .env.example                ← Plantilla de variables de entorno
├── .env.local                  ← Variables locales (no en git)
├── docs/                       ← Documentación del sistema
├── issues-docs/                ← ISSUE DOCs por cada tarea
├── prisma/
│   ├── schema.prisma           ← Schema de base de datos
│   ├── migrations/             ← Migraciones generadas
│   └── seed.ts                 ← Script de seed
├── src/
│   ├── app/                    ← Rutas Next.js (App Router)
│   │   ├── (public)/           ← Rutas públicas
│   │   ├── admin/              ← Panel de administración
│   │   └── api/                ← Route Handlers
│   ├── modules/                ← Módulos de dominio
│   │   ├── booking/
│   │   ├── calendar/
│   │   ├── payment/
│   │   ├── notification/
│   │   ├── gallery/
│   │   ├── content/
│   │   ├── auth/
│   │   ├── admin/
│   │   └── audit/
│   ├── components/
│   │   ├── ui/                 ← Componentes Shadcn/UI
│   │   ├── layout/             ← Navbar, Footer, etc.
│   │   └── shared/             ← Componentes reutilizables
│   ├── lib/                    ← Utilidades compartidas
│   │   ├── db/prisma.ts
│   │   ├── auth/
│   │   ├── api/
│   │   ├── stripe/
│   │   ├── resend/
│   │   ├── supabase/
│   │   ├── env.ts
│   │   ├── logger.ts
│   │   └── utils/
│   ├── hooks/                  ← Custom React hooks
│   ├── schemas/                ← Esquemas Zod compartidos
│   ├── types/                  ← Tipos TypeScript globales
│   └── styles/
│       └── globals.css
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── public/                     ← Assets estáticos
```

---

# 12. Workflow de desarrollo diario

```
1. Verificar qué Issue hay asignada
2. git checkout develop && git pull
3. git checkout -b feature/[id]-[nombre]
4. Leer el ISSUE DOC en /issues-docs/
5. Desarrollar siguiendo el ISSUE DOC
6. pnpm typecheck && pnpm lint && pnpm test:run
7. git commit -m "feat(scope): descripción"
8. git push origin feature/[id]-[nombre]
9. Crear PR en GitHub
10. Esperar que CI pase
11. Merge a develop
```

---

# 13. Problemas comunes

## Error: Cannot find module '@prisma/client'

```bash
pnpm db:generate
```

## Error: Environment variable not found

Verificar que `.env.local` existe y tiene todas las variables de `.env.example`.

## Error: Stripe webhook signature invalid

Verificar que el `STRIPE_WEBHOOK_SECRET` en `.env.local` coincide con el que imprime `stripe listen`.

## Error: Prisma migration failed

Si estás usando `DATABASE_URL` con pgbouncer, las migraciones requieren `DIRECT_URL`. Verificar que ambas están en `.env.local`.

## Tests fallan en CI pero pasan local

Verificar que los GitHub Secrets tienen los mismos valores que `.env.local`. Ver ENV-001 para la lista completa.

---

# 14. Contacto y recursos

- Documentación del sistema: `/docs/`
- Issues y tareas: GitHub Issues del repositorio
- Stripe docs: [stripe.com/docs](https://stripe.com/docs)
- Resend docs: [resend.com/docs](https://resend.com/docs)
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Better Auth docs: [better-auth.com](https://www.better-auth.com)
- Prisma docs: [prisma.io/docs](https://www.prisma.io/docs)
