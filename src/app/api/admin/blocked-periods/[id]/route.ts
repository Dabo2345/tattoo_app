import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (session) => {
    const { id } = await params

    const existing = await prisma.blockedPeriod.findFirst({ where: { id } })

    if (!existing) {
      return Response.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Período bloqueado no encontrado" },
        },
        { status: 404 }
      )
    }

    await prisma.blockedPeriod.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        action: "BLOCKED_PERIOD_DELETED",
        entityId: id,
        entityType: "BlockedPeriod",
        adminUserId: session.user.id,
        metadata: {
          startsAt: existing.startsAt.toISOString(),
          endsAt: existing.endsAt.toISOString(),
        },
      },
    })

    return Response.json({ success: true, data: { id } })
  })
}
