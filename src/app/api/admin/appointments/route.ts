import { z } from "zod"
import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { AppointmentStatus, AppointmentType } from "@prisma/client"

const appointmentsQuerySchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  type: z.nativeEnum(AppointmentType).optional(),
  from: z
    .string()
    .datetime({ message: "El parámetro 'from' debe ser una fecha ISO válida" })
    .optional(),
  to: z
    .string()
    .datetime({ message: "El parámetro 'to' debe ser una fecha ISO válida" })
    .optional(),
})

export async function GET(request: Request) {
  return withAdminAuth(request, async () => {
    const { searchParams } = new URL(request.url)

    const parsed = appointmentsQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Parámetros inválidos"
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message } },
        { status: 400 }
      )
    }

    const { status, type, from, to } = parsed.data

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(type && { type }),
      ...(from || to
        ? {
            startsAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    }

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        type: true,
        status: true,
        startsAt: true,
        endsAt: true,
        notes: true,
        depositRequired: true,
        depositAmount: true,
        client: {
          select: { name: true, email: true, phone: true },
        },
      },
      orderBy: { startsAt: "desc" },
    })

    const data = appointments.map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      notes: a.notes,
      depositRequired: a.depositRequired,
      depositAmount: a.depositAmount ? Number(a.depositAmount) : null,
      client: { name: a.client.name, email: a.client.email, phone: a.client.phone },
    }))

    return Response.json({ success: true, data: { appointments: data, total: data.length } })
  })
}
