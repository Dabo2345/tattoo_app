"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

type FormState = "idle" | "loading" | "success" | "error"

export function RequestLinkForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<FormState>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/magic-links/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? "Error al enviar el enlace")
      }
      setState("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado")
      setState("error")
    }
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 mt-6" role="status">
        <CheckCircle className="h-8 w-8 text-green-500" aria-hidden="true" />
        <p className="text-sm text-foreground-secondary text-center">
          Si el email está registrado, recibirás un nuevo enlace en breve.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 w-full max-w-sm mx-auto">
      <label htmlFor="request-link-email" className="text-sm font-medium text-foreground">
        Tu email
      </label>
      <input
        id="request-link-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        disabled={state === "loading"}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />
      {state === "error" && <p className="text-xs text-destructive">{errorMsg}</p>}
      <Button type="submit" disabled={state === "loading"}>
        {state === "loading" ? "Enviando…" : "Solicitar nuevo enlace"}
      </Button>
    </form>
  )
}
