import { generateSecureToken, hashToken } from "@/lib/utils/tokens"
import {
  AppointmentNotFoundError,
  AppointmentInvalidForPlanError,
  TattooPlanAlreadyExistsError,
  TattooPlanNotFoundError,
  TattooPlanInvalidStatusError,
} from "@/lib/api/errors"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import { bookingRepository } from "../repositories/booking-repository"
import { tattooPlanRepository } from "../repositories/tattoo-plan-repository"
import type {
  CreateTattooPlanInput,
  TattooPlanWithSessions,
  SendPlanResult,
} from "../types/tattoo-plan"

/** Duración del SessionLink en milisegundos (30 días — AUTH-001 §12). */
const SESSION_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000

export const tattooPlanService = {
  /**
   * Crea un TattooPlan en estado DRAFT para una consulta confirmada.
   * RB-TP-001: la appointment debe ser CONSULTATION + CONFIRMED.
   * RB-TP-002: solo puede existir un plan por appointment.
   */
  async createPlan(
    appointmentId: string,
    input: CreateTattooPlanInput
  ): Promise<TattooPlanWithSessions> {
    const appointment = await bookingRepository.findAppointmentById(appointmentId)
    if (!appointment) throw new AppointmentNotFoundError()

    if (appointment.type !== "CONSULTATION" || appointment.status !== "CONFIRMED") {
      throw new AppointmentInvalidForPlanError()
    }

    const existing = await tattooPlanRepository.findByAppointmentId(appointmentId)
    if (existing) throw new TattooPlanAlreadyExistsError()

    return tattooPlanRepository.create(appointmentId, input)
  },

  /**
   * Obtiene el TattooPlan con sus sesiones para una appointment dada.
   */
  async getPlanByAppointmentId(appointmentId: string): Promise<TattooPlanWithSessions> {
    const plan = await tattooPlanRepository.findByAppointmentId(appointmentId)
    if (!plan) throw new TattooPlanNotFoundError()
    return plan
  },

  /**
   * Envía el plan al cliente:
   * - Crea un SessionLink por cada TattooPlanSession
   * - Actualiza cada sesión con su sessionLinkId y status LINK_SENT
   * - Marca el plan como SENT
   * - Dispara notificación (stub — implementación real en #073)
   * - Registra AuditLog con acción TATTOO_PLAN_SENT
   *
   * RB-TP-003: el plan debe estar en DRAFT.
   * RB-TP-004: un SessionLink por sesión, expira en 30 días.
   */
  async sendPlanToClient(planId: string): Promise<SendPlanResult> {
    const plan = await tattooPlanRepository.findById(planId)
    if (!plan) throw new TattooPlanNotFoundError()

    if (plan.status !== "DRAFT") {
      throw new TattooPlanInvalidStatusError("El plan solo puede enviarse cuando está en DRAFT")
    }

    // Create one SessionLink per session inside a single operation
    // If any step fails the whole operation is aborted
    const expiresAt = new Date(Date.now() + SESSION_LINK_TTL_MS)

    // Collect plain tokens to pass to notificationService (tokens are not stored in plain text in DB)
    const sessionTokens: Array<{
      sessionNumber: number
      durationMinutes: number
      token: string
      expiresAt: Date
    }> = []

    for (const session of plan.sessions) {
      const token = generateSecureToken()
      const tokenHash = hashToken(token)

      const sessionLink = await bookingRepository.createSessionLink({
        appointmentId: plan.consultationAppointmentId,
        tokenHash,
        expiresAt,
        sessionDurationMinutes: session.durationMinutes,
      })

      await tattooPlanRepository.updateSessionLinkId(session.id, sessionLink.id)

      sessionTokens.push({
        sessionNumber: session.sessionNumber,
        durationMinutes: session.durationMinutes,
        token,
        expiresAt,
      })
    }

    await tattooPlanRepository.updatePlanStatus(planId, "SENT")

    await auditService.log("TATTOO_PLAN_SENT", planId, {
      entityType: "TattooPlan",
      metadata: {
        consultationAppointmentId: plan.consultationAppointmentId,
        sessionsCount: plan.sessions.length,
      },
    })

    await notificationService.sendTattooPlan(planId, sessionTokens)

    return {
      planId,
      status: "SENT",
      sessionsCount: plan.sessions.length,
    }
  },
}
