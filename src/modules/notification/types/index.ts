import type { NotificationType, NotificationStatus } from "@prisma/client"

export type { NotificationType, NotificationStatus }

// ─── Payloads por tipo de notificación ───────────────────────────────────────

export interface ConsultationConfirmedPayload {
  clientName: string
  clientEmail: string
  appointmentDate: string
  appointmentTime: string
  magicLinkUrl: string
  depositAmount: number
}

export interface SessionConfirmedPayload {
  clientName: string
  clientEmail: string
  appointmentDate: string
  appointmentTime: string
  durationMinutes: number
  artistNotes?: string
}

export interface AppointmentCancelledPayload {
  clientName: string
  clientEmail: string
  appointmentDate: string
  refundAmount: number
  refundDays: number
}

export interface AppointmentRescheduledPayload {
  clientName: string
  clientEmail: string
  oldDate: string
  newDate: string
  newTime: string
  magicLinkUrl: string
}

export interface MagicLinkSentPayload {
  clientName: string
  clientEmail: string
  magicLinkUrl: string
  expiresInHours: number
}

export interface SessionLinkSentPayload {
  clientName: string
  clientEmail: string
  sessionLinkUrl: string
  expiresInHours: number
  artistNotes?: string
}

export interface ReminderPayload {
  clientName: string
  clientEmail: string
  appointmentDate: string
  appointmentTime: string
  hoursUntil: 24 | 2
}

export type NotificationPayload =
  | ConsultationConfirmedPayload
  | SessionConfirmedPayload
  | AppointmentCancelledPayload
  | AppointmentRescheduledPayload
  | MagicLinkSentPayload
  | SessionLinkSentPayload
  | ReminderPayload
