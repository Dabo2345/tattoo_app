"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth/client"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      setError("Credenciales incorrectas. Inténtalo de nuevo.")
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
          autoComplete="email"
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
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
          autoComplete="current-password"
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

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
