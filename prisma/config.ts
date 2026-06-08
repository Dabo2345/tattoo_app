import { defineConfig } from "prisma/config"

export default defineConfig({
  datasource: {
    // URL con pooling para runtime (PgBouncer en Supabase, puerto 6543)
    url: process.env.DATABASE_URL ?? "",
    // URL directa para migraciones (puerto 5432 — sin pooling)
    directUrl: process.env.DIRECT_URL ?? "",
  },
})
