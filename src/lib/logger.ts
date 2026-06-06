import pino from "pino"

const isDevelopment = process.env.NODE_ENV === "development"
const isTest = process.env.NODE_ENV === "test"

export const logger = pino({
  level: isTest ? "silent" : isDevelopment ? "debug" : "info",
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
