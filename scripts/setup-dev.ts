/**
 * setup-dev.ts
 * Configura el entorno de desarrollo completo en un solo comando:
 *   1. Genera el cliente Prisma
 *   2. Aplica migraciones pendientes
 *   3. Ejecuta el seed
 *   4. Crea el admin por defecto (si no existe)
 *
 * Uso: pnpm setup
 */
import { execSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import path from "path"

const root = process.cwd()
const envFile = path.join(root, ".env.local")

const ADMIN_EMAIL = "admin@estudio.com"
const ADMIN_PASSWORD = "admin1234"
const ADMIN_NAME = "Admin"

/** Lee .env.local y devuelve un objeto con las variables */
function loadEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, "utf-8")
  const vars: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "")
    vars[key] = val
  }
  return vars
}

function run(cmd: string, label: string, extraEnv?: Record<string, string>) {
  process.stdout.write(`⏳ ${label}...`)
  try {
    execSync(cmd, {
      stdio: "pipe",
      cwd: root,
      env: { ...process.env, ...(extraEnv ?? {}) },
    })
    console.log(` ✅`)
  } catch (e: unknown) {
    console.log(` ❌`)
    const err = e as { stderr?: Buffer; stdout?: Buffer }
    const out = err.stderr?.toString() || err.stdout?.toString() || String(e)
    console.error(out)
    process.exit(1)
  }
}

function check() {
  if (!existsSync(envFile)) {
    console.error(`\n❌ No se encontró .env.local en ${root}`)
    console.error("   Copia .env.example como .env.local y rellena tus credenciales.\n")
    process.exit(1)
  }
}

async function setup() {
  console.log("\n🚀 Configurando entorno de desarrollo...\n")

  check()

  // Cargar vars del .env.local para pasarlas a los subprocesos
  const envVars = loadEnvFile(envFile)

  run("npx prisma generate", "Generando cliente Prisma", envVars)
  run("npx prisma migrate deploy", "Aplicando migraciones", envVars)
  run("npx tsx prisma/seed.ts", "Cargando seed", envVars)
  run(
    `npx tsx scripts/create-admin.ts "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" "${ADMIN_NAME}"`,
    `Creando admin (${ADMIN_EMAIL})`,
    envVars
  )

  console.log(`
✅ Setup completado.

   Credenciales de admin:
   Email:      ${ADMIN_EMAIL}
   Contraseña: ${ADMIN_PASSWORD}

▶  Arranca la app con: pnpm dev
   Abre: http://localhost:3000
`)
}

setup()
