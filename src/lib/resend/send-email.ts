import type { ReactElement } from "react"
import { resend } from "./client"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailParams {
  to: string
  subject: string
  react: ReactElement
  text?: string
}

export interface SendEmailResult {
  success: true
}

export interface SendEmailError {
  success: false
  error: string
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Envía un email via Resend.
 * Nunca lanza excepción (NP-003). Si falla, retorna { success: false, error }.
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult | SendEmailError> {
  const { to, subject, react, text } = params

  try {
    const { error } = await resend.emails.send({
      from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      react,
      text,
    })

    if (error) {
      logger.error({ error, to, subject }, "Resend returned error sending email")
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ error: err, to, subject }, "Failed to send email via Resend")
    return { success: false, error: message }
  }
}
