import { prisma } from "@/lib/db/prisma"

export const clientRepository = {
  /**
   * Busca un cliente por email. Devuelve null si no existe.
   */
  async findByEmail(email: string) {
    return prisma.client.findUnique({ where: { email } })
  },

  /**
   * Devuelve el cliente existente si el email ya está registrado,
   * o crea uno nuevo si no existe. RB-001: clientes sin cuenta.
   */
  async findOrCreate(data: { name: string; email: string; phone: string }) {
    return prisma.client.upsert({
      where: { email: data.email },
      update: {},
      create: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    })
  },
}
