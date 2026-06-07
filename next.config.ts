import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  // better-auth y sus adapters tienen deps complejas — no bundlear en el servidor
  serverExternalPackages: ["better-auth", "@better-auth/kysely-adapter"],
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },
  webpack: {
    automaticVercelMonitors: false,
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
