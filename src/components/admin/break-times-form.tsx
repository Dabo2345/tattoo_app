"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateBreakTimesAction, type BreakTime } from "@/app/admin/settings/actions"

interface BreakTimesFormProps {
  initial: BreakTime[]
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i)
const minuteOptions = [0, 15, 30, 45]

export function BreakTimesForm({ initial }: BreakTimesFormProps) {
  const [breaks, setBreaks] = useState<BreakTime[]>(initial)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function addBreak() {
    if (breaks.length >= 10) return
    setBreaks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        startHour: 14,
        startMinute: 0,
        endHour: 15,
        endMinute: 0,
      },
    ])
  }

  function removeBreak(id: string) {
    setBreaks((prev) => prev.filter((b) => b.id !== id))
  }

  function updateBreak(id: string, field: keyof BreakTime, value: string | number) {
    setBreaks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateBreakTimesAction({ breaks })
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? "Error al guardar")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario pausas diarias">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pausas diarias</h2>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Las pausas bloquean automáticamente los slots de reserva.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBreak}
          disabled={breaks.length >= 10}
        >
          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Añadir
        </Button>
      </div>

      {breaks.length === 0 && (
        <p className="text-xs text-foreground-muted">
          Sin pausas configuradas. El estudio estará disponible durante todo el horario laboral.
        </p>
      )}

      <div className="space-y-3">
        {breaks.map((b) => (
          <div
            key={b.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end rounded border border-border bg-background p-3"
          >
            <div>
              <label className="text-[10px] text-foreground-muted uppercase tracking-wide mb-1 block">
                Nombre
              </label>
              <input
                type="text"
                value={b.label}
                onChange={(e) => updateBreak(b.id, "label", e.target.value)}
                maxLength={100}
                placeholder="Pausa comida"
                required
                className="w-full px-2 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[10px] text-foreground-muted uppercase tracking-wide mb-1 block">
                Inicio
              </label>
              <div className="flex gap-1">
                <select
                  value={b.startHour}
                  onChange={(e) => updateBreak(b.id, "startHour", parseInt(e.target.value, 10))}
                  aria-label="Hora inicio pausa"
                  className="w-14 px-1.5 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {pad(h)}
                    </option>
                  ))}
                </select>
                <select
                  value={b.startMinute}
                  onChange={(e) => updateBreak(b.id, "startMinute", parseInt(e.target.value, 10))}
                  aria-label="Minuto inicio pausa"
                  className="w-14 px-1.5 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {minuteOptions.map((m) => (
                    <option key={m} value={m}>
                      {pad(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-foreground-muted uppercase tracking-wide mb-1 block">
                Fin
              </label>
              <div className="flex gap-1">
                <select
                  value={b.endHour}
                  onChange={(e) => updateBreak(b.id, "endHour", parseInt(e.target.value, 10))}
                  aria-label="Hora fin pausa"
                  className="w-14 px-1.5 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {pad(h)}
                    </option>
                  ))}
                </select>
                <select
                  value={b.endMinute}
                  onChange={(e) => updateBreak(b.id, "endMinute", parseInt(e.target.value, 10))}
                  aria-label="Minuto fin pausa"
                  className="w-14 px-1.5 py-1.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
                >
                  {minuteOptions.map((m) => (
                    <option key={m} value={m}>
                      {pad(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeBreak(b.id)}
              aria-label={`Eliminar pausa ${b.label || b.id}`}
              className="self-end p-1.5 text-foreground-muted hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-xs text-green-400">
          Pausas guardadas correctamente.
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar pausas"}
      </Button>
    </form>
  )
}
