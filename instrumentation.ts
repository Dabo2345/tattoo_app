export { captureRequestError as onRequestError } from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: Sentry } = await import("@sentry/nextjs")
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === "development",
      enabled: process.env.NODE_ENV === "production",
    })
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { default: Sentry } = await import("@sentry/nextjs")
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
    })
  }
}
