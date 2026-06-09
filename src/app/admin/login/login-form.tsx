"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "@/lib/auth/client"

export function LoginForm() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect immediately if session is already active (SEC-AUTH-004)
  useEffect(() => {
    if (session) {
      router.replace("/admin")
    }
  }, [session, router])

  // Don't flash the form while the session check is in flight
  if (isPending || session) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn.email({
      email,
      password,
      callbackURL: "/admin",
    })

    if (result.error) {
      // HTTP 429 → account locked after too many attempts (AUTH-001 §10)
      if (result.error.status === 429) {
        setError("Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo.")
      } else {
        // Generic message — never reveal if the email exists (SEC-AUTH-003)
        setError("Credenciales incorrectas. Inténtalo de nuevo.")
      }
      setLoading(false)
      return
    }

    router.push("/admin")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-hover text-foreground font-medium py-2 px-4 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
