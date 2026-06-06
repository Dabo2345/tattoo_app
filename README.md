# Tattoo App — Plataforma Web para Estudio de Tatuajes

Plataforma web profesional para estudio de tatuajes. Gestión de reservas, pagos de depósitos, galería de portfolio y panel administrativo.

---

## ¿Qué hace esta aplicación?

- **Portfolio público**: Galería de trabajos con filtros por estilo
- **Reserva de consultas**: Sistema de booking con pago de depósito via Stripe
- **Gestión de sesiones**: Reserva de sesiones de tatuaje mediante links privados (SessionLinks)
- **Gestión de citas**: Los clientes gestionan sus citas via enlaces seguros (MagicLinks)
- **Panel administrativo**: Agenda, gestión de contenido, galería y configuración

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict mode) |
| UI | React 19 + Shadcn/UI + TailwindCSS 4 |
| Base de datos | PostgreSQL via Supabase + Prisma ORM |
| Auth | Better Auth (solo admin) |
| Pagos | Stripe (checkout + webhooks + reembolsos) |
| Email | Resend |
| Storage | Supabase Storage |
| Testing | Vitest + Playwright + Testing Library |
| CI/CD | GitHub Actions + Vercel |
| Monitoring | Sentry |

---

## Setup local

Ver [ONBOARD-001](/docs/Documento%2019%20—%20ONBOARD-001%20—%20Setup%20Local%20y%20Onboarding.md) para instrucciones completas.

### Requisitos previos

- Node.js 20+
- pnpm 9+
- Git

### Pasos rápidos

```bash
# 1. Clonar repositorio
git clone https://github.com/[usuario]/tattoo_app.git
cd tattoo_app

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. Aplicar migraciones de base de datos
pnpm db:migrate

# 5. Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Tests unitarios (Vitest) |
| `pnpm test:e2e` | Tests E2E (Playwright) |
| `pnpm test:coverage` | Coverage report |
| `pnpm db:migrate` | Aplicar migraciones Prisma |
| `pnpm db:generate` | Generar cliente Prisma |
| `pnpm db:studio` | Prisma Studio (GUI de base de datos) |
| `pnpm db:seed` | Poblar base de datos con datos de prueba |

---

## Documentación

Toda la documentación del proyecto está en `/docs/`:

| Documento | Propósito |
|-----------|-----------|
| ADR-001 | Arquitectura general del sistema |
| STD-001 | Stack tecnológico oficial |
| GOV-001 | Gobernanza y workflow de desarrollo |
| DATA-001 | Modelo de dominio y base de datos |
| DATA-002 | Reglas de negocio |
| API-001 | Diseño de APIs y contratos |
| AUTH-001 | Autenticación, autorización y seguridad |
| UX-001 | Flujos de usuario y UX |
| UI-001 | Sistema de diseño |
| FRONT-001 | Arquitectura frontend |
| BACK-001 | Arquitectura backend |
| TEST-001 | Estrategia de testing |
| DEVOPS-001 | CI/CD y GitHub Flow |
| PM-001 | Product management y roadmap |
| NOTIF-001 | Sistema de notificaciones |
| ENV-001 | Variables de entorno |
| ERROR-001 | Estrategia de error handling |
| ONBOARD-001 | Setup local y onboarding |
| DEPLOY-001 | Runbook de deployment |

---

## Workflow de desarrollo

Este proyecto sigue un flujo estricto de trabajo con Issues y PRs.

Ver [CLAUDE.md](/CLAUDE.md) para las reglas completas de colaboración con IA.

```
Issue → ISSUE DOC → rama feature/* → código → tests → PR → CI → Merge
```

Rama principal: `main` (producción)
Rama de integración: `develop` (staging)

---

## Entornos

| Entorno | Rama | URL |
|---------|------|-----|
| Development | local | `http://localhost:3000` |
| Staging | `develop` | Auto-deploy en Vercel |
| Production | `main` | Auto-deploy en Vercel |

---

## Contribución

Ver GOV-001 para las reglas de gobernanza.

1. Toda tarea debe tener una Issue en GitHub
2. Crear rama desde `develop`: `feature/[id]-[nombre]`
3. Seguir Conventional Commits: `feat(booking): add slot validation`
4. PR obligatorio con checklist completo
5. CI debe pasar antes de merge
