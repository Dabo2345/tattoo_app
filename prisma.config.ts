import { defineConfig } from "prisma/config"
import { config } from "dotenv"
import path from "path"

// Prisma CLI no carga .env.local automáticamente (eso lo hace Next.js)
// Lo cargamos aquí para que db:migrate, db:studio, db:generate, etc. funcionen
config({ path: path.resolve(process.cwd(), ".env.local") })

export default defineConfig({
  datasource: {
    // DIRECT_URL para operaciones de CLI (migrate, introspect) — sin PgBouncer
    // PrismaClient en runtime usa DATABASE_URL (pooling) vía constructor
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
})
