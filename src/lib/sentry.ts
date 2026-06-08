import * as Sentry from "@sentry/nextjs"

/**
 * Captura una excepción y la envía a Sentry.
 * Solo reporta en producción. En desarrollo y tests, loguea en consola.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    })
  } else {
    console.error("[Sentry would capture]:", error, context ?? "")
  }
}

/**
 * Captura un mensaje de nivel error en Sentry.
 */
export function captureMessage(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(message, {
      level: "error",
      extra: context,
    })
  }
}
