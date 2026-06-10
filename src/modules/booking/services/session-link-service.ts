import { generateSecureToken, hashToken } from "@/lib/utils/tokens"
import {
  AppointmentNotFoundError,
  LinkAlreadyUsedError,
  LinkExpiredError,
  LinkNotFoundError,
} from "@/lib/api/errors"
import { bookingRepository } from "../repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import type {
  CreateSessionLinkInput,
  CreateSessionLinkResult,
  ValidateSessionLinkResult,
} from "../types"

/** Duración del SessionLink en milisegundos (AUTH-001 §12: 30 días). */
const SESSION_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000

export const sessionLinkService = {
  /**
   * Genera un SessionLink para el appointment indicado.
   * AUTH-001 §12: expira en 30 días. RB-005: un solo uso.
   * Lanza AppointmentNotFoundError si el appointment no existe.
   * Devuelve el token plano para construir la URL del cliente.
   */
  async createSessionLink(input: CreateSessionLinkInput): Promise<CreateSessionLinkResult> {
    const appointment = await bookingRepository.findAppointmentById(input.appointmentId)
    if (!appointment) {
      throw new AppointmentNotFoundError()
    }

    const token = generateSecureToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + SESSION_LINK_TTL_MS)

    await bookingRepository.createSessionLink({
      appointmentId: input.appointmentId,
      tokenHash,
      expiresAt,
      sessionDurationMinutes: input.sessionDurationMinutes,
      artistNotes: input.artistNotes,
    })

    await auditService.log("SESSION_LINK_CREATED", input.appointmentId, {
      entityType: "SessionLink",
      metadata: {
        expiresAt: expiresAt.toISOString(),
        sessionDurationMinutes: input.sessionDurationMinutes,
      },
    })

    return { token, expiresAt }
  },

  /**
   * Valida un SessionLink por su token plano.
   * Hashea el token, busca en DB, verifica expiración y uso previo.
   * Lanza LinkNotFoundError, LinkExpiredError o LinkAlreadyUsedError según el caso.
   * Devuelve los datos del link si es válido.
   */
  async validateSessionLink(token: string): Promise<ValidateSessionLinkResult> {
    const tokenHash = hashToken(token)

    const sessionLink = await bookingRepository.findSessionLinkByHash(tokenHash)
    if (!sessionLink) {
      throw new LinkNotFoundError()
    }

    if (sessionLink.expiresAt < new Date()) {
      throw new LinkExpiredError()
    }

    if (sessionLink.usedAt !== null) {
      throw new LinkAlreadyUsedError()
    }

    return {
      expiresAt: sessionLink.expiresAt,
      sessionDurationMinutes: sessionLink.sessionDurationMinutes,
      artistNotes: sessionLink.artistNotes,
    }
  },
}
