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

  // Appointment de prueba (CONFIRMED, en 7 días)
  const startsAt = new Date()
  startsAt.setDate(startsAt.getDate() + 7)
  startsAt.setHours(11, 0, 0, 0)

  const endsAt = new Date(startsAt)
  endsAt.setHours(12, 0, 0, 0)

  const appointment = await prisma.appointment.upsert({
    where: { id: "seed-appointment-001" },
    update: {},
    create: {
      id: "seed-appointment-001",
      clientId: client.id,
      type: "CONSULTATION",
      status: "CONFIRMED",
      startsAt,
      endsAt,
      depositRequired: true,
      depositAmount: 50,
      notes: "Primera consulta de prueba",
    },
  })

  console.log(`✅ Appointment de prueba: ${appointment.id}`)
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
