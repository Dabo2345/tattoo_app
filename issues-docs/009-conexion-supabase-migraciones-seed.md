# ISSUE #009 — Conexión Supabase, migraciones Prisma y seed básico

## Epic
EPIC 2 — Database & Auth

## Type
Task

## Priority
P0

## Dependencies
- #008 — Schema Prisma completo

---

## Contexto

El schema de Prisma está definido pero no hay conexión a una base de datos real. Esta issue establece la conexión con Supabase (PostgreSQL), aplica las migraciones para crear las tablas, y crea un seed para tener datos de desarrollo útiles. Sin esto, ninguna funcionalidad que requiera base de datos puede probarse.

---

## Objetivo

Conectar la aplicación a Supabase, aplicar la primera migración con el schema completo, crear el cliente Prisma singleton y un seed básico con datos de prueba.

---

## Scope

- Crear `/src/lib/db/prisma.ts` con el cliente Prisma singleton
- Aplicar la primera migración: `prisma migrate dev --name init`
- Verificar que las tablas se crean correctamente en Supabase
- Crear `prisma/seed.ts` con datos básicos de desarrollo:
  - Un admin user
  - Algunos StyleTags de ejemplo
  - Algunas GalleryImages de ejemplo
  - Un Client y Appointment de ejemplo para pruebas
- Configurar el script `db:seed` en package.json
- Instalar `tsx` para ejecutar el seed en TypeScript

---

## Anti-scope

- No implementar lógica de negocio sobre los datos
- No crear la lógica de admin user de Better Auth (eso es #010)
- No crear bucket de Supabase Storage (eso es #012)

---

## Archivos afectados

```
src/lib/db/
  prisma.ts               ← CREAR
prisma/
  migrations/             ← GENERADO AUTOMÁTICAMENTE por prisma migrate
  seed.ts                 ← CREAR
package.json              ← MODIFICAR (añadir tsx, script db:seed)
```

---

## Flujo de ejecución

1. Crear rama `feature/009-supabase-migraciones` desde `develop`
2. Instalar `tsx`: `pnpm add -D tsx`
3. Crear `/src/lib/db/prisma.ts` con singleton
4. Asegurar que `.env.local` tiene `DATABASE_URL` y `DIRECT_URL` correctas (Supabase)
5. Ejecutar primera migración: `pnpm db:migrate` → nombre "init"
6. Verificar en Supabase Dashboard que las tablas se crearon
7. Crear `prisma/seed.ts` con datos básicos
8. Ejecutar seed: `pnpm db:seed`
9. Verificar datos en Prisma Studio: `pnpm db:studio`
10. Ejecutar `pnpm typecheck && pnpm lint`
11. Crear PR a `develop`

> NOTA: La migración se hace localmente. En CI y producción se usa `prisma migrate deploy` (no `dev`).

---

## Implementación

### /src/lib/db/prisma.ts

```typescript
import { PrismaClient } from "@prisma/client"
import { env } from "@/lib/env"

// Patrón singleton para evitar múltiples instancias en desarrollo (HMR)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

### prisma/seed.ts

```typescript
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // StyleTags de ejemplo
  const styleTags = await Promise.all([
    prisma.styleTag.upsert({
      where: { slug: "realismo" },
      update: {},
      create: { name: "Realismo", slug: "realismo" },
    }),
    prisma.styleTag.upsert({
      where: { slug: "blackwork" },
      update: {},
      create: { name: "Blackwork", slug: "blackwork" },
    }),
    prisma.styleTag.upsert({
      where: { slug: "geometrico" },
      update: {},
      create: { name: "Geométrico", slug: "geometrico" },
    }),
    prisma.styleTag.upsert({
      where: { slug: "acuarela" },
      update: {},
      create: { name: "Acuarela", slug: "acuarela" },
    }),
    prisma.styleTag.upsert({
      where: { slug: "tradicional" },
      update: {},
      create: { name: "Tradicional", slug: "tradicional" },
    }),
  ])

  console.log(`✅ ${styleTags.length} StyleTags creados`)

  // Cliente de prueba
  const client = await prisma.client.upsert({
    where: { email: "cliente.prueba@example.com" },
    update: {},
    create: {
      name: "Cliente de Prueba",
      email: "cliente.prueba@example.com",
      phone: "+34600000001",
    },
  })

  console.log(`✅ Client de prueba: ${client.email}`)

  // Appointment de prueba (CONFIRMED)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 7)
  tomorrow.setHours(11, 0, 0, 0)

  const appointmentEnd = new Date(tomorrow)
  appointmentEnd.setHours(12, 0, 0, 0)

  const appointment = await prisma.appointment.upsert({
    where: { id: "seed-appointment-001" },
    update: {},
    create: {
      id: "seed-appointment-001",
      clientId: client.id,
      type: "CONSULTATION",
      status: "CONFIRMED",
      startsAt: tomorrow,
      endsAt: appointmentEnd,
      depositRequired: true,
      depositAmount: 50,
      notes: "Primera consulta de prueba",
    },
  })

  console.log(`✅ Appointment de prueba creado: ${appointment.id}`)

  console.log("🎉 Seed completado exitosamente")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Actualización en package.json

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## Reglas del sistema aplicables

- DATA-001: Todas las reglas del schema (UUIDs, timestamps, soft delete, UTC)
- ENV-001: `DATABASE_URL` usa pooling (6543), `DIRECT_URL` usa conexión directa (5432) para migraciones
- BACK-001: Un único cliente Prisma singleton compartido via `globalThis`
- DEVOPS-001: La migración inicial se hace en desarrollo, en CI/producción se usa `migrate deploy`

---

## Criterios de aceptación

- [ ] `/src/lib/db/prisma.ts` existe con el cliente singleton
- [ ] `pnpm db:migrate` aplica la migración sin errores
- [ ] Las tablas aparecen en Supabase Dashboard (Table Editor)
- [ ] `pnpm db:seed` ejecuta sin errores
- [ ] Los datos del seed aparecen en Supabase (StyleTags, Client, Appointment)
- [ ] `pnpm db:studio` abre Prisma Studio y muestra los datos
- [ ] `pnpm typecheck` pasa — los imports de `@prisma/client` funcionan

---

## Edge cases

- Si `DATABASE_URL` usa pooling (pgbouncer), `prisma migrate dev` falla: usar `DIRECT_URL` en el paso de migración. El Makefile o script puede hacer esto automáticamente
- Si hay un error de conexión SSL: añadir `?sslmode=require` al final de la URL
- El seed usa `upsert` para ser idempotente: ejecutarlo múltiples veces no duplica datos
- En CI, las migraciones deben ejecutarse con `prisma migrate deploy` (no `dev`) usando `DIRECT_URL`

---

## Tests requeridos

```typescript
// tests/integration/db/prisma.test.ts
import { prisma } from "@/lib/db/prisma"

describe("Prisma connection", () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("conecta a la base de datos correctamente", async () => {
    // Verificar que la conexión funciona con una query simple
    const result = await prisma.$queryRaw`SELECT 1 as one`
    expect(result).toBeDefined()
  })

  it("el singleton no crea múltiples instancias", () => {
    const { prisma: prisma2 } = require("@/lib/db/prisma")
    expect(prisma).toBe(prisma2)
  })
})
```

---

## Definition of Done

- [ ] `/src/lib/db/prisma.ts` creado
- [ ] Primera migración aplicada en Supabase (tablas visibles)
- [ ] `prisma/seed.ts` creado y ejecutado exitosamente
- [ ] Tests de integración de conexión creados y pasando
- [ ] `pnpm build && pnpm typecheck` pasan
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
