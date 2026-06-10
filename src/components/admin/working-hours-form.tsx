"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { updateWorkingHoursAction, type WorkingHoursInput } from "@/app/admin/settings/actions"

interface WorkingHoursFormProps {
  initial: WorkingHoursInput
}

export function WorkingHoursForm({ initial }: WorkingHoursFormProps) {
  const [startHour, setStartHour] = useState(String(initial.workingStartHour))
  const [startMinute, setStartMinute] = useState(String(initial.workingStartMinute))
  const [endHour, setEndHour] = useState(String(initial.workingEndHour))
  const [endMinute, setEndMinute] = useState(String(initial.workingEndMinute))
  const [slotDuration, setSlotDuration] = useState(String(initial.slotDurationMinutes))
  const [consultDuration, setConsultDuration] = useState(
    String(initial.consultationDurationMinutes)
  )

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const input: WorkingHoursInput = {
      workingStartHour: parseInt(startHour, 10),
      workingStartMinute: parseInt(startMinute, 10),
      workingEndHour: parseInt(endHour, 10),
      workingEndMinute: parseInt(endMinute, 10),
      slotDurationMinutes: parseInt(slotDuration, 10),
      consultationDurationMinutes: parseInt(consultDuration, 10),
    }

    startTransition(async () => {
      const result = await updateWorkingHoursAction(input)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? "Error al guardar")
      }
    })
  }

  const minuteOptions = ["00", "30"]
  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario horarios laborales">
      <h2 className="text-sm font-semibold text-foreground">Horarios laborales</h2>
      <p className="text-xs text-foreground-secondary">
        Horario en el que el estudio acepta citas. Aplica de lunes a domingo.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-foreground-muted uppercase tracking-wide mb-2 block">
            Hora de apertura
          </label>
          <div className="flex gap-2">
            <select
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              aria-label="Hora de inicio"
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
            >
              {hourOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <select
              value={startMinute}
              onChange={(e) => setStartMinute(e.target.value)}
              aria-label="Minutos de inicio"
              className="w-20 px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
            >
              {minuteOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-foreground-muted uppercase tracking-wide mb-2 block">
            Hora de cierre
          </label>
          <div className="flex gap-2">
            <select
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              aria-label="Hora de fin"
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
            >
              {hourOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <select
              value={endMinute}
              onChange={(e) => setEndMinute(e.target.value)}
              aria-label="Minutos de fin"
              className="w-20 px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
            >
              {minuteOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="slot-duration"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Intervalo de slots (min)
          </label>
          <input
            id="slot-duration"
            type="number"
            value={slotDuration}
            onChange={(e) => setSlotDuration(e.target.value)}
            min={15}
            max={120}
            step={15}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="consult-duration"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Duración consulta (min)
          </label>
          <input
            id="consult-duration"
            type="number"
            value={consultDuration}
            onChange={(e) => setConsultDuration(e.target.value)}
            min={30}
            max={240}
            step={30}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-xs text-green-400">
          Horarios guardados correctamente.
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  )
}
