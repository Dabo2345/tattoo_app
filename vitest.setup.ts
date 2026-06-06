import "@testing-library/jest-dom"

// ─── Variables de entorno mínimas para tests ─────────────────────────────────
// Permiten que src/lib/env.ts se importe sin lanzar error en el entorno de test.
// Los tests individuales pueden sobreescribir estas variables para sus casos.

Object.assign(process.env, {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/testdb",
  DIRECT_URL: "postgresql://user:pass@localhost:5432/testdb",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:3000",
  STRIPE_SECRET_KEY: "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  STRIPE_WEBHOOK_SECRET: "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  RESEND_API_KEY: "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  RESEND_FROM_EMAIL: "test@example.com",
  RESEND_FROM_NAME: "Test Studio",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NODE_ENV: "test",
})
