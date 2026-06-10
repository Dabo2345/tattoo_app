"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { updateDepositAmountAction, type DepositInput } from "@/app/admin/settings/actions"

interface DepositFormProps {
  initial: DepositInput
}

export function DepositForm({ initial }: DepositFormProps) {
  const [amount, setAmount] = useState(String(initial.depositAmount))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateDepositAmountAction({
        depositAmount: parseFloat(amount),
      })
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? "Error al guardar")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario depósito">
      <h2 className="text-sm font-semibold text-foreground">Depósito de consulta</h2>
      <p className="text-xs text-foreground-secondary">
        Importe requerido para confirmar una reserva de consulta. Introduce 0 para consultas
        gratuitas.
      </p>

      <div>
        <label
          htmlFor="deposit-amount"
          className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
        >
          Importe (€)
        </label>
        <input
          id="deposit-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          max={9999.99}
          step={0.01}
          required
          className="w-full max-w-xs px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-xs text-green-400">
          Depósito guardado correctamente.
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar depósito"}
      </Button>
    </form>
  )
}
