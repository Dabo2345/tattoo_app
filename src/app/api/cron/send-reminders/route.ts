import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { notificationRepository } from "@/modules/notification/repositories/notification-repository"
import { notificationService } from "@/modules/notification/services/notification-service"

/**
 * POST /api/cron/send-reminders
 *
 * Envía recordatorios automáticos a appointments CONFIRMED:
 * - 24h antes (ventana: 23h30m – 24h30m desde ahora)
 * - 2h antes  (ventana: 1h30m  – 2h30m  desde ahora)
 *
 * Autenticado con Bearer CRON_SECRET (NOTIF-001 §7.2).
 * Idempotente: si ya existe Notification del tipo, se ignora.
 * Configurado en vercel.json para ejecutarse cada 30 minutos.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Auth ───────────────────────────────────────────────────────────────────
  if (!env.CRON_SECRET) {
    logger.error("CRON_SECRET no configurado — endpoint desactivado")
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 })
  }

  const authHeader = request.headers.get("Authorization")
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    logger.warn("Intento de acceso al cron con credenciales inválidas")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Ventanas de tiempo ────────────────────────────────────────────────────
  const now = new Date()

  const window24hStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000)
  const window24hEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000)

  const window2hStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000)
  const window2hEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000)

  // ── Buscar appointments CONFIRMED en cada ventana ─────────────────────────
  const [appointments24h, appointments2h] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        deletedAt: null,
        startsAt: { gte: window24hStart, lte: window24hEnd },
      },
      select: { id: true },
    }),
    prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        deletedAt: null,
        startsAt: { gte: window2hStart, lte: window2hEnd },
      },
      select: { id: true },
    }),
  ])

  logger.info(
    { found24h: appointments24h.length, found2h: appointments2h.length },
    "Cron send-reminders: appointments encontrados"
  )

  // ── Enviar recordatorios 24h (idempotente) ────────────────────────────────
  let sent24h = 0
  for (const { id } of appointments24h) {
    const exists = await notificationRepository.existsByAppointmentAndType(id, "REMINDER_24H")
    if (!exists) {
      await notificationService.sendReminder24h(id)
      sent24h++
    }
  }

  // ── Enviar recordatorios 2h (idempotente) ─────────────────────────────────
  let sent2h = 0
  for (const { id } of appointments2h) {
    const exists = await notificationRepository.existsByAppointmentAndType(id, "REMINDER_2H")
    if (!exists) {
      await notificationService.sendReminder2h(id)
      sent2h++
    }
  }

  logger.info({ sent24h, sent2h }, "Cron send-reminders: completado")

  return NextResponse.json({ success: true, data: { sent24h, sent2h } })
}
