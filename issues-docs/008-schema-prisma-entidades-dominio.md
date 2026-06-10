# ISSUE #008 — Schema Prisma completo (todas las entidades de DATA-001)

## Epic
EPIC 2 — Database & Auth

## Type
Task

## Priority
P0

## Dependencies
- #002 — Next.js y estructura base (carpeta prisma/ existe)

---

## Contexto

El modelo de dominio está definido en DATA-001 con todas las entidades, relaciones y enumeraciones. Este schema es el contrato central del sistema de datos. Debe trasladarse al schema de Prisma de forma exacta, respetando todas las reglas de DATA-001 (UUIDs, timestamps, soft deletes, UTC). Sin el schema completo, ninguna funcionalidad de booking, pagos ni notificaciones puede implementarse.

---

## Objetivo

Escribir el schema completo de Prisma que refleje exactamente todas las entidades definidas en DATA-001, con sus relaciones, enumeraciones, constraints e índices necesarios para el rendimiento.

---

## Scope

- Escribir `prisma/schema.prisma` completo con todas las entidades de DATA-001:
  - Client
  - Appointment
  - SessionLink
  - MagicLink
  - Payment
  - Refund
  - BlockedPeriod
  - GalleryImage
  - StyleTag
  - Notification
  - AdminUser (gestionada por Better Auth)
  - AuditLog
- Definir todos los enums: AppointmentType, AppointmentStatus, PaymentStatus, NotificationStatus, NotificationType, MagicLinkPurpose
- Configurar el datasource para Supabase (con `directUrl` para migraciones)
- Configurar el generator client
- Añadir índices en campos de búsqueda frecuente

---

## Anti-scope

- No conectar a Supabase todavía (#009)
- No generar migraciones (#009)
- No escribir seed (#009)
- No implementar lógica de negocio

---

## Archivos afectados

```
prisma/schema.prisma        ← CREAR/COMPLETAR
```

---

## Flujo de ejecución

1. Crear rama `feature/008-schema-prisma` desde `develop`
2. Instalar Prisma: `pnpm add -D prisma` y `pnpm add @prisma/client`
3. Inicializar Prisma: `pnpm dlx prisma init --datasource-provider postgresql`
4. Escribir el schema completo siguiendo DATA-001
5. Ejecutar `pnpm dlx prisma validate` para verificar el schema
6. Ejecutar `pnpm db:generate` para generar el cliente (sin conexión a DB)
7. Ejecutar `pnpm typecheck` para verificar que los tipos de Prisma compilan
8. Crear PR a `develop`

---

## Schema completo de Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── ENUMERACIONES ────────────────────────────────────────────────────────────

enum AppointmentType {
  CONSULTATION
  TATTOO_SESSION
}

enum AppointmentStatus {
  PENDING_PAYMENT
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}

enum NotificationType {
  CONSULTATION_CONFIRMED
  SESSION_CONFIRMED
  APPOINTMENT_CANCELLED
  APPOINTMENT_RESCHEDULED
  MAGIC_LINK_SENT
  SESSION_LINK_SENT
  REMINDER_24H
  REMINDER_2H
}

enum MagicLinkPurpose {
  MANAGE_APPOINTMENT
}

// ─── ENTIDADES ────────────────────────────────────────────────────────────────

model Client {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  phone     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  appointments Appointment[]

  @@map("clients")
}

model Appointment {
  id              String            @id @default(uuid())
  clientId        String
  type            AppointmentType
  status          AppointmentStatus @default(PENDING_PAYMENT)
  startsAt        DateTime
  endsAt          DateTime
  notes           String?
  depositRequired Boolean           @default(true)
  depositAmount   Decimal?          @db.Decimal(10, 2)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  deletedAt       DateTime?

  client        Client         @relation(fields: [clientId], references: [id])
  payment       Payment?
  sessionLink   SessionLink?
  magicLinks    MagicLink[]
  notifications Notification[]
  auditLogs     AuditLog[]

  @@index([clientId])
  @@index([status])
  @@index([startsAt])
  @@index([type, status])
  @@map("appointments")
}

model SessionLink {
  id                  String    @id @default(uuid())
  appointmentId       String    @unique
  tokenHash           String    @unique
  expiresAt           DateTime
  usedAt              DateTime?
  sessionDurationMinutes Int
  artistNotes         String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@index([tokenHash])
  @@map("session_links")
}

model MagicLink {
  id            String           @id @default(uuid())
  appointmentId String
  tokenHash     String           @unique
  expiresAt     DateTime
  purpose       MagicLinkPurpose @default(MANAGE_APPOINTMENT)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@index([tokenHash])
  @@index([appointmentId])
  @@map("magic_links")
}

model Payment {
  id                    String        @id @default(uuid())
  appointmentId         String        @unique
  stripePaymentIntentId String        @unique
  amount                Decimal       @db.Decimal(10, 2)
  currency              String        @default("eur")
  status                PaymentStatus @default(PENDING)
  paidAt                DateTime?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  appointment Appointment @relation(fields: [appointmentId], references: [id])
  refund      Refund?

  @@map("payments")
}

model Refund {
  id             String   @id @default(uuid())
  paymentId      String   @unique
  stripeRefundId String   @unique
  amount         Decimal  @db.Decimal(10, 2)
  refundedAt     DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  payment Payment @relation(fields: [paymentId], references: [id])

  @@map("refunds")
}

model BlockedPeriod {
  id          String    @id @default(uuid())
  startsAt    DateTime
  endsAt      DateTime
  reason      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([startsAt, endsAt])
  @@map("blocked_periods")
}

model StyleTag {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  images GalleryImage[]

  @@map("style_tags")
}

model GalleryImage {
  id           String    @id @default(uuid())
  url          String
  thumbnailUrl String
  altText      String?
  order        Int       @default(0)
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  styleTags StyleTag[]

  @@index([deletedAt])
  @@index([order])
  @@map("gallery_images")
}

model Notification {
  id            String             @id @default(uuid())
  appointmentId String
  type          NotificationType
  status        NotificationStatus @default(PENDING)
  sentAt        DateTime?
  failedAt      DateTime?
  errorMessage  String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@index([appointmentId])
  @@index([status])
  @@map("notifications")
}

model AuditLog {
  id            String    @id @default(uuid())
  action        String
  entityId      String?
  entityType    String?
  adminUserId   String?
  clientId      String?
  metadata      Json?
  createdAt     DateTime  @default(now())

  appointment   Appointment? @relation(fields: [entityId], references: [id], map: "audit_log_appointment")

  @@index([action])
  @@index([entityId, entityType])
  @@index([adminUserId])
  @@map("audit_logs")
}

// AdminUser es gestionado por Better Auth — se define en #010
// Se añade aquí como modelo placeholder para referencias
model AdminUser {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("admin_users")
}
```

---

## Reglas del sistema aplicables

- DATA-001: Todos los IDs son UUID (`@default(uuid())`)
- DATA-001: Todos los modelos tienen `createdAt` y `updatedAt`
- DATA-001: Soft deletes via `deletedAt DateTime?` (Client, Appointment, GalleryImage)
- DATA-001: Fechas en UTC (Prisma maneja UTC por defecto con PostgreSQL)
- DATA-001: Email y phone de Client son únicos
- DATA-001: `startsAt < endsAt` se valida en la capa de servicio, no en el schema
- DATA-001: SessionLink es de un solo uso (`usedAt`)
- DATA-001: MagicLink no tiene concepto de "usado" — solo expira

---

## Criterios de aceptación

- [ ] `pnpm dlx prisma validate` pasa sin errores
- [ ] `pnpm db:generate` genera el cliente sin errores
- [ ] `pnpm typecheck` pasa — los tipos de Prisma están disponibles
- [ ] Todas las entidades de DATA-001 están en el schema
- [ ] Todos los enums de DATA-001 están definidos
- [ ] Los campos `createdAt` y `updatedAt` existen en todos los modelos
- [ ] Los campos `deletedAt` existen en Client, Appointment y GalleryImage
- [ ] Los índices en campos de búsqueda frecuente están añadidos

---

## Edge cases

- `AuditLog.entityId` usa String (no FK estricta) porque puede referenciar diferentes entidades
- La relación `AuditLog → Appointment` es opcional para soportar logs de otras entidades
- `GalleryImage ↔ StyleTag` es many-to-many — Prisma lo genera automáticamente con tabla implícita
- `Decimal` en Amount y Refund para evitar problemas de punto flotante con dinero

---

## Tests requeridos

No aplica tests automáticos para el schema. La verificación es:
- `prisma validate` pasa
- `prisma generate` genera los tipos correctamente
- En #009 se verificará que las migraciones se aplican sin errores

---

## Definition of Done

- [ ] `prisma/schema.prisma` completo con todas las entidades
- [ ] `pnpm dlx prisma validate` pasa
- [ ] `pnpm db:generate` pasa
- [ ] `pnpm typecheck` pasa
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
