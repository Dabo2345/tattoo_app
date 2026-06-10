import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// IDs singleton (deben coincidir con los exportados en las actions correspondientes)
const ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"
const STUDIO_INFO_ID = "00000000-0000-0000-0000-000000000002"
const STUDIO_CONFIG_ID = "00000000-0000-0000-0000-000000000003"

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

  // ArtistProfile singleton
  await prisma.artistProfile.upsert({
    where: { id: ARTIST_PROFILE_ID },
    update: {},
    create: {
      id: ARTIST_PROFILE_ID,
      name: "Nombre del artista",
      bio: "Aquí va la biografía del artista. Edítala desde el panel de administración.",
      specialties: ["Realismo", "Blackwork"],
      instagramHandle: null,
      yearsOfExperience: null,
    },
  })

  console.log("✅ ArtistProfile singleton creado")

  // StudioInfo singleton
  await prisma.studioInfo.upsert({
    where: { id: STUDIO_INFO_ID },
    update: {},
    create: {
      id: STUDIO_INFO_ID,
      name: "Nombre del estudio",
      description: "Descripción del estudio. Edítala desde el panel de administración.",
      address: "Calle Ejemplo, 1",
      city: "Madrid",
      phone: "+34600000000",
      email: "contacto@estudio.com",
      instagramHandle: null,
      googleMapsUrl: null,
    },
  })

  console.log("✅ StudioInfo singleton creado")

  // StudioConfig singleton
  await prisma.studioConfig.upsert({
    where: { id: STUDIO_CONFIG_ID },
    update: {},
    create: {
      id: STUDIO_CONFIG_ID,
      workingStartHour: 10,
      workingStartMinute: 0,
      workingEndHour: 20,
      workingEndMinute: 0,
      slotDurationMinutes: 30,
      consultationDurationMinutes: 60,
      depositAmount: 50.0,
      breaks: [],
    },
  })

  console.log("✅ StudioConfig singleton creado")
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
