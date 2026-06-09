import { z } from "zod"
import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const calendarQuerySchema = z
  .object({
    from: z.string().datetime({ message: "El parámetro 'from' debe ser una fecha ISO válida" }),
    to: z.string().datetime({ message: "El parámetro 'to' debe ser una fecha ISO válida" }),
  })
  .refine((data) => new Date(data.from) <= new Date(data.to), {
    message: "'from' no puede ser posterior a 'to'",
    path: ["from"],
  })

export async function GET(request: Request) {
  return withAdminAuth(request, async () => {
    const { searchParams } = new URL(request.url)

    const parsed = calendarQuerySchema.safeParse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message } },
        { status: 400 }
      )
    }

    const { from, to } = parsed.data

    const appointments = await prisma.appointment.findMany({
      where: {
        deletedAt: null,
        startsAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      select: {
        id: true,
        type: true,
        status: true,
        startsAt: true,
        endsAt: true,
        client: {
          select: { name: true, email: true, phone: true },
        },
      },
      orderBy: { startsAt: "asc" },
    })

    const data = appointments.map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      client: { name: a.client.name, email: a.client.email, phone: a.client.phone },
    }))

    return Response.json({ success: true, data: { appointments: data } })
  })
}
