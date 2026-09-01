import pino from "pino"

const isDevelopment = process.env.NODE_ENV === "development"
const isTest = process.env.NODE_ENV === "test"

export const logger = pino({
  level: isTest ? "silent" : isDevelopment ? "debug" : "info",
  // Serialize both 'err' (pino convention) and 'error' (our convention) so
  // Error objects are converted to plain JSON before reaching the pino-pretty
  // worker thread. Without this, passing an Error via postMessage crashes the
  // worker on Node.js / Windows ("the worker has exited").
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // En producción: JSON estructurado para Sentry/Vercel logs
})

export type Logger = typeof logger
