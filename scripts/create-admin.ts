import { config } from "dotenv"
import path from "path"

// Cargar .env.local antes de importar módulos que usen env
config({ path: path.resolve(process.cwd(), ".env.local") })

import { prisma } from "../src/lib/db/prisma"
import { auth } from "../src/lib/auth"
import * as readline from "readline"

async function createAdmin() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const question = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve))

  console.log("── Crear Administrador ──────────────────")
  const email = await question("Email: ")
  const password = await question("Contraseña (mín. 8 chars): ")
  const name = await question("Nombre: ")
  rl.close()

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    })
    console.log(`\n✅ Administrador creado: ${email}`)
  } catch (error) {
    console.error("\n❌ Error al crear administrador:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
