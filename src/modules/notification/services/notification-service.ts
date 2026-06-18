import { createElement } from "react"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/resend/send-email"
import { magicLinkService } from "@/modules/booking/services/magic-link-service"
import { daysUntilAppointment } from "@/modules/payment/services/deposit-policy"
import { notificationRepository } from "../repositories/notification-repository"
import { ConsultationConfirmedEmail } from "../templates/consultation-confirmed"
import { SessionConfirmedEmail } from "../templates/session-confirmed"
import { AppointmentCancelledEmail } from "../templates/appointment-cancelled"
import { AppointmentRescheduledEmail } from "../templates/appointment-rescheduled"
import { MagicLinkEmail } from "../templates/magic-link"
import { SessionLinkEmail } from "../templates/session-link"
import { Reminder24hEmail } from "../templates/reminder-24h"
import { Reminder2hEmail } from "../templates/reminder-2h"

// ─── Constants ────────────────────────────────────────────────────────────────

const MAGIC_LINK_TTL_HOURS = 2
const REFUND_PROCESSING_DAYS = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(date)
}

// ─── NotificationService ──────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Enviado al cliente tras confirmar el pago de la consulta (Stripe webhook).
   * Crea un MagicLink nuevo para incluirlo en el email (NP-003, NP-005).
   */
  async sendConsultationConfirmed(appointmentId: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, payment: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendConsultationConfirmed: appointment not found")
        return
      }

      const { token } = await magicLinkService.createMagicLink(appointmentId)
      const magicLinkUrl = `${env.NEXT_PUBLIC_APP_URL}/magic-link/${token}`

      const notification = await notificationRepository.create(
        appointmentId,
        "CONSULTATION_CONFIRMED"
      )

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        appointmentDate: formatDate(appointment.startsAt),
        appointmentTime: formatTime(appointment.startsAt),
        magicLinkUrl,
        depositAmount: Number(appointment.payment?.amount ?? 0),
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: `Consulta confirmada — ${payload.appointmentDate} a las ${payload.appointmentTime}`,
        react: createElement(ConsultationConfirmedEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error(
          { appointmentId, error: result.error },
          "sendConsultationConfirmed: email failed"
        )
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendConsultationConfirmed: unexpected error")
    }
  },

  /**
   * Enviado al cliente tras confirmar una sesión de tatuaje vía SessionLink.
   * Calcula la duración a partir de startsAt/endsAt del appointment.
   */
  async sendSessionConfirmed(appointmentId: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendSessionConfirmed: appointment not found")
        return
      }

      const notification = await notificationRepository.create(appointmentId, "SESSION_CONFIRMED")
      const durationMinutes = Math.round(
        (appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000
      )

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        appointmentDate: formatDate(appointment.startsAt),
        appointmentTime: formatTime(appointment.startsAt),
        durationMinutes,
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: `Sesión confirmada — ${payload.appointmentDate} a las ${payload.appointmentTime}`,
        react: createElement(SessionConfirmedEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error({ appointmentId, error: result.error }, "sendSessionConfirmed: email failed")
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendSessionConfirmed: unexpected error")
    }
  },

  /**
   * Enviado al cliente tras cancelar una cita (cliente o admin).
   * Calcula si hay reembolso basándose en los días restantes hasta la cita.
   */
  async sendAppointmentCancelled(appointmentId: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, payment: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendAppointmentCancelled: appointment not found")
        return
      }

      const refundEligible =
        daysUntilAppointment(appointment.startsAt) >= 4 && appointment.payment !== null

      const notification = await notificationRepository.create(
        appointmentId,
        "APPOINTMENT_CANCELLED"
      )

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        appointmentDate: formatDate(appointment.startsAt),
        refundAmount: refundEligible ? Number(appointment.payment!.amount) : 0,
        refundDays: refundEligible ? REFUND_PROCESSING_DAYS : 0,
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: `Cita cancelada — ${payload.appointmentDate}`,
        react: createElement(AppointmentCancelledEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error(
          { appointmentId, error: result.error },
          "sendAppointmentCancelled: email failed"
        )
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendAppointmentCancelled: unexpected error")
    }
  },

  /**
   * Enviado al cliente tras reprogramar una cita.
   * Requiere oldStartsAt porque la fecha ya fue sobreescrita en DB al llamar al servicio.
   */
  async sendAppointmentRescheduled(appointmentId: string, oldStartsAt: Date): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendAppointmentRescheduled: appointment not found")
        return
      }

      const { token } = await magicLinkService.createMagicLink(appointmentId)
      const magicLinkUrl = `${env.NEXT_PUBLIC_APP_URL}/magic-link/${token}`

      const notification = await notificationRepository.create(
        appointmentId,
        "APPOINTMENT_RESCHEDULED"
      )

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        oldDate: formatDate(oldStartsAt),
        newDate: formatDate(appointment.startsAt),
        newTime: formatTime(appointment.startsAt),
        magicLinkUrl,
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: `Cita reprogramada — ${payload.newDate} a las ${payload.newTime}`,
        react: createElement(AppointmentRescheduledEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error(
          { appointmentId, error: result.error },
          "sendAppointmentRescheduled: email failed"
        )
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendAppointmentRescheduled: unexpected error")
    }
  },

  /**
   * Enviado al cliente al solicitar un MagicLink de gestión de cita.
   * El token ya fue generado por el caller — aquí solo se construye la URL y se envía.
   */
  async sendMagicLink(appointmentId: string, magicLinkToken: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendMagicLink: appointment not found")
        return
      }

      const magicLinkUrl = `${env.NEXT_PUBLIC_APP_URL}/magic-link/${magicLinkToken}`
      const notification = await notificationRepository.create(appointmentId, "MAGIC_LINK_SENT")

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        magicLinkUrl,
        expiresInHours: MAGIC_LINK_TTL_HOURS,
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: `Tu enlace de acceso — válido ${MAGIC_LINK_TTL_HOURS}h`,
        react: createElement(MagicLinkEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error({ appointmentId, error: result.error }, "sendMagicLink: email failed")
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendMagicLink: unexpected error")
    }
  },

  /**
   * Enviado al cliente al generar un SessionLink desde el panel de admin.
   * El token ya fue generado por el caller — aquí se construye la URL y se envía.
   */
  async sendSessionLink(appointmentId: string, sessionLinkToken: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, sessionLink: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendSessionLink: appointment not found")
        return
      }

      const sessionLinkUrl = `${env.NEXT_PUBLIC_APP_URL}/book/${sessionLinkToken}`
      const expiresInHours = appointment.sessionLink
        ? Math.round((appointment.sessionLink.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
        : 720

      const notification = await notificationRepository.create(appointmentId, "SESSION_LINK_SENT")

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        sessionLinkUrl,
        expiresInHours,
        artistNotes: appointment.sessionLink?.artistNotes ?? undefined,
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: "Tu enlace para reservar sesión de tatuaje",
        react: createElement(SessionLinkEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error({ appointmentId, error: result.error }, "sendSessionLink: email failed")
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendSessionLink: unexpected error")
    }
  },

  /**
   * Enviado al cliente cuando el admin envía el plan de tatuaje con los enlaces de reserva.
   * TODO: #073 — implementar template de email y envío real.
   */
  async sendTattooPlan(planId: string): Promise<void> {
    // Stub: el template y envío real se implementan en issue #073
    logger.info({ planId }, "sendTattooPlan: stub — pendiente implementación en #073")
  },

  /**
   * Recordatorio 24h antes de la cita. Llamado por el cron job.
   */
  async sendReminder24h(appointmentId: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendReminder24h: appointment not found")
        return
      }

      const notification = await notificationRepository.create(appointmentId, "REMINDER_24H")

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        appointmentDate: formatDate(appointment.startsAt),
        appointmentTime: formatTime(appointment.startsAt),
        hoursUntil: 24 as const,
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: `Recordatorio: tu cita es mañana — ${payload.appointmentTime}`,
        react: createElement(Reminder24hEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error({ appointmentId, error: result.error }, "sendReminder24h: email failed")
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendReminder24h: unexpected error")
    }
  },

  /**
   * Recordatorio 2h antes de la cita. Llamado por el cron job.
   */
  async sendReminder2h(appointmentId: string): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true },
      })
      if (!appointment) {
        logger.error({ appointmentId }, "sendReminder2h: appointment not found")
        return
      }

      const notification = await notificationRepository.create(appointmentId, "REMINDER_2H")

      const payload = {
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        appointmentDate: formatDate(appointment.startsAt),
        appointmentTime: formatTime(appointment.startsAt),
        hoursUntil: 2 as const,
      }

      const result = await sendEmail({
        to: appointment.client.email,
        subject: `Recordatorio: tu cita es hoy — ${payload.appointmentTime}`,
        react: createElement(Reminder2hEmail, payload),
      })

      if (result.success) {
        await notificationRepository.markSent(notification.id)
      } else {
        await notificationRepository.markFailed(notification.id, result.error)
        logger.error({ appointmentId, error: result.error }, "sendReminder2h: email failed")
      }
    } catch (err) {
      logger.error({ appointmentId, error: err }, "sendReminder2h: unexpected error")
    }
  },
}
