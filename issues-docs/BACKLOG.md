# BACKLOG — Tattoo App

> Generado desde PM-001 + PM-002 | Fecha: 2026-06-06 | Total: 58 issues

---

## Orden de ejecución OBLIGATORIO

```
EPIC 1 (Foundation) → EPIC 2 (DB + Auth) → EPIC 3 (Booking Engine)
→ EPIC 4 (Magic/Session Links) → EPIC 5 (Client UI)
→ EPIC 6 (Admin) → EPIC 7 (Notifications) → EPIC 8 (Hardening)
```

---

## EPIC 1 — System Foundation
> Prioridad: P0 | Issues: #001–#007

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #001 | Setup repositorio y ramas en GitHub | — | ⬜ |
| #002 | Setup Next.js 15, TypeScript strict y estructura de carpetas | #001 | ⬜ |
| #003 | GitHub Actions: CI workflow (lint, typecheck, test, build) | #001 | ⬜ |
| #004 | Validación de variables de entorno con Zod (env.ts) | #002 | ⬜ |
| #005 | Setup Pino logger y cliente Sentry | #004 | ⬜ |
| #006 | Setup TailwindCSS 4, tokens UI-001 y Shadcn/UI base | #002 | ⬜ |
| #007 | Layout base: Navbar, Footer y sistema de rutas App Router | #006 | ⬜ |

---

## EPIC 2 — Database & Auth
> Prioridad: P0 | Issues: #008–#012

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #008 | Schema Prisma completo (todas las entidades de DATA-001) | #002 | ⬜ |
| #009 | Conexión Supabase, migraciones Prisma y seed básico | #008 | ⬜ |
| #010 | Better Auth: configuración, admin login y protección de rutas | #009, #007 | ⬜ |
| #011 | API helpers: response factory, error handler, auth middleware | #005, #010 | ⬜ |
| #012 | Supabase Storage: bucket de galería y helpers de upload | #009 | ⬜ |

---

## EPIC 3 — Booking Engine Core
> Prioridad: P0 | Issues: #013–#022

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #013 | CalendarService: motor de slots de 30min y disponibilidad | #011 | ⬜ |
| #014 | API GET /api/availability: consultar slots disponibles | #013 | ⬜ |
| #015 | BookingService: crear Consultation con estado PENDING_PAYMENT | #013 | ⬜ |
| #016 | API POST /api/consultations: endpoint de creación de consulta | #015 | ⬜ |
| #017 | Stripe: crear Checkout Session para depósito de consulta | #016 | ⬜ |
| #018 | Stripe Webhook: confirmar appointment tras pago exitoso | #017 | ⬜ |
| #019 | DepositPolicy: lógica de cancelación y cálculo de reembolso | #018 | ⬜ |
| #020 | API POST /api/appointments/:id/cancel | #019 | ⬜ |
| #021 | API POST /api/appointments/:id/reschedule | #019 | ⬜ |
| #022 | AuditService: registro de acciones del sistema | #011 | ⬜ |

---

## EPIC 4 — Magic & Session Links
> Prioridad: P0 | Issues: #023–#027

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #023 | Token utils: generación segura con crypto y hashing SHA-256 | #011 | ⬜ |
| #024 | MagicLinkService: generación, almacenamiento y validación | #023, #022 | ⬜ |
| #025 | APIs MagicLink: POST /request y GET /:token | #024 | ⬜ |
| #026 | SessionLinkService: generación, almacenamiento y validación | #023, #022 | ⬜ |
| #027 | APIs SessionLink: GET /:token y POST /:token/book | #026, #015 | ⬜ |

---

## EPIC 5 — Client Platform (UI pública)
> Prioridad: P1 | Issues: #028–#036

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #028 | Componentes UI base: Button, Input, Card, Modal, Badge, Toast | #006 | ⬜ |
| #029 | Componentes de booking: CalendarPublic y SlotPicker | #028, #014 | ⬜ |
| #030 | Página Home (/) | #028, #007 | ⬜ |
| #031 | Página Galería (/galeria) + API GET /api/gallery | #028, #012 | ⬜ |
| #032 | Página Perfil artista (/perfil) + API GET /api/content/profile | #028 | ⬜ |
| #033 | Página Estudio (/estudio) + API GET /api/content/studio | #028 | ⬜ |
| #034 | Flujo completo de reserva (/reservar): calendario + form + Stripe | #029, #016, #017 | ⬜ |
| #035 | Página MagicLink (/magic-link/:token): gestión de cita | #028, #025, #020, #021 | ⬜ |
| #036 | Página SessionLink (/session-link/:token): reserva de sesión | #028, #027 | ⬜ |

---

## EPIC 6 — Admin System
> Prioridad: P1 | Issues: #037–#045

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #037 | Página admin login (/admin/login) | #010, #028 | ⬜ |
| #038 | Dashboard admin (/admin): agenda semanal | #037 | ⬜ |
| #039 | API GET /api/admin/calendar + vista de detalle de citas | #038 | ⬜ |
| #040 | Admin: cancelar y reprogramar citas desde panel | #039, #020, #021 | ⬜ |
| #041 | Admin: bloquear períodos + API POST /api/admin/blocked-periods | #039 | ⬜ |
| #042 | Admin: generar SessionLinks + API POST /api/admin/session-links | #037, #026 | ⬜ |
| #043 | Admin: gestión de galería (upload, reordenar, soft delete) | #037, #012 | ⬜ |
| #044 | Admin: editar perfil artista y studio info | #037 | ⬜ |
| #045 | Admin: configuración (horarios laborales, pausas, depósito) | #037, #013 | ⬜ |

---

## EPIC 7 — Notification System
> Prioridad: P1 | Issues: #046–#050

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #046 | Setup Resend: cliente, módulo y estructura de plantillas | #011 | ⬜ |
| #047 | Templates React Email: consultation-confirmed y session-confirmed | #046 | ⬜ |
| #048 | Templates React Email: cancelled, rescheduled, magic-link, session-link | #046 | ⬜ |
| #049 | NotificationService: triggers automáticos desde BookingService | #047, #048, #018, #022 | ⬜ |
| #050 | Sistema de recordatorios: endpoint cron + lógica 24h y 2h | #049 | ⬜ |

---

## EPIC 8 — Hardening
> Prioridad: P2/P3 | Issues: #051–#058

| # | Título | Deps | Estado |
|---|--------|------|--------|
| #051 | Unit tests: BookingService, CalendarService y DepositPolicy | #019, #013 | ⬜ |
| #052 | Integration tests: APIs de booking, pagos y magic links | #025, #027, #020 | ⬜ |
| #053 | E2E: flujo completo de reserva de consulta | #034 | ⬜ |
| #054 | E2E: flujo de cancelación via MagicLink y reserva via SessionLink | #035, #036 | ⬜ |
| #055 | SEO: meta tags y Open Graph para páginas públicas | #030, #031, #032 | ⬜ |
| #056 | Headers HTTP de seguridad y rate limiting en APIs públicas | #016, #025 | ⬜ |
| #057 | Health check endpoint (/api/health) | #009 | ⬜ |
| #058 | Optimización de imágenes WebP y lazy loading | #031, #043 | ⬜ |

---

## Resumen

| Epic | Issues | Prioridad |
|------|--------|-----------|
| EPIC 1 — System Foundation | #001–#007 (7) | P0 |
| EPIC 2 — Database & Auth | #008–#012 (5) | P0 |
| EPIC 3 — Booking Engine | #013–#022 (10) | P0 |
| EPIC 4 — Magic & Session Links | #023–#027 (5) | P0 |
| EPIC 5 — Client Platform | #028–#036 (9) | P1 |
| EPIC 6 — Admin System | #037–#045 (9) | P1 |
| EPIC 7 — Notifications | #046–#050 (5) | P1 |
| EPIC 8 — Hardening | #051–#058 (8) | P2/P3 |
| **TOTAL** | **58 issues** | |

---

## Grafo de dependencias críticas

```
#001 → #002 → #004 → #005 → #011 → #013 → #015 → #016 → #017 → #018
              ↓                                              ↓
             #003                                          #019 → #020
              ↓                                              ↓
             #006 → #007 → #010                            #021
              ↓                      ↓
             #008 → #009 → #010      #022 → #023 → #024 → #025
                      ↓                              ↓
                     #012             #026 → #027
```
