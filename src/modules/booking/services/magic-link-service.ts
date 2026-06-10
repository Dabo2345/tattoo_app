import { generateSecureToken, hashToken } from "@/lib/utils/tokens"
import { AppointmentNotFoundError, LinkExpiredError, LinkNotFoundError } from "@/lib/api/errors"
import { bookingRepository } from "../repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import type { CreateMagicLinkResult, ValidateMagicLinkResult } from "../types"

/** Duración del MagicLink en milisegundos (RB-007: 2 horas). */
const MAGIC_LINK_TTL_MS = 2 * 60 * 60 * 1000

export const magicLinkService = {
  /**
   * Genera un MagicLink para el appointment indicado.
   * RB-007: expira en 2 horas. AUTH-001: solo el hash se almacena en DB.
   * Lanza AppointmentNotFoundError si el appointment no existe.
   * Devuelve el token plano para construir la URL del cliente.
   */
  async createMagicLink(appointmentId: string): Promise<CreateMagicLinkResult> {
    const appointment = await bookingRepository.findAppointmentById(appointmentId)
    if (!appointment) {
      throw new AppointmentNotFoundError()
    }

    const token = generateSecureToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS)

    await bookingRepository.createMagicLink({ appointmentId, tokenHash, expiresAt })

    await auditService.log("MAGIC_LINK_CREATED", appointmentId, {
      entityType: "MagicLink",
      metadata: { expiresAt: expiresAt.toISOString() },
    })

    return { token, expiresAt }
  },

  /**
   * Valida un MagicLink por su token plano.
   * Hashea el token, busca en DB, verifica expiración.
   * Lanza LinkNotFoundError si no existe, LinkExpiredError si expiró.
   * Devuelve el appointment con datos del cliente si es válido.
   */
  async validateMagicLink(token: string): Promise<ValidateMagicLinkResult> {
    const tokenHash = hashToken(token)

    const magicLink = await bookingRepository.findMagicLinkWithAppointment(tokenHash)
    if (!magicLink) {
      throw new LinkNotFoundError()
    }

    if (magicLink.expiresAt < new Date()) {
      throw new LinkExpiredError()
    }

    const { appointment } = magicLink

    return {
      appointment: {
        id: appointment.id,
        type: appointment.type,
        status: appointment.status,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        notes: appointment.notes,
        client: {
          id: appointment.client.id,
          name: appointment.client.name,
          email: appointment.client.email,
          phone: appointment.client.phone,
        },
      },
    }
  },
}
