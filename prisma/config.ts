import { defineConfig } from "prisma/config"

export default defineConfig({
  datasource: {
    // URL para el runtime (pooling con PgBouncer en Supabase)
    url: process.env.DATABASE_URL ?? "",
  },
})
