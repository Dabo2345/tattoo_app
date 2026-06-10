import { config } from "dotenv"
import path from "path"

config({ path: path.resolve(process.cwd(), ".env.local") })

import { prisma } from "../src/lib/db/prisma"
import { auth } from "../src/lib/auth"

/**
 * Crea un administrador de forma no interactiva.
 * Uso: pnpm db:create-admin [email] [password] [name]
 * O via variables de entorno: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */
async function createAdmin() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL
  const password = process.argv[3] || process.env.ADMIN_PASSWORD
  const name = process.argv[4] || process.env.ADMIN_NAME || "Admin"

  if (!email || !password) {
    console.error("Uso: pnpm db:create-admin <email> <password> [nombre]")
    console.error("Ej:  pnpm db:create-admin admin@estudio.com admin1234 Admin")
    process.exit(1)
  }

  if (password.length < 8) {
    console.error("❌ La contraseña debe tener al menos 8 caracteres")
    process.exit(1)
  }

  try {
    // Si ya existe, no falla — simplemente lo indica
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.log(`ℹ️  El administrador ya existe: ${email}`)
      return
    }

    await auth.api.signUpEmail({
      body: { email, password, name },
    })
    console.log(`✅ Administrador creado: ${email}`)
  } catch (error) {
    console.error("❌ Error al crear administrador:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
