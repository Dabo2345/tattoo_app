"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import type { CreateTattooPlanInput } from "../types/tattoo-plan"

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  "Blackwork",
  "Japanese",
  "Watercolor",
  "Traditional",
  "Neo-Traditional",
  "Realism",
  "Geometric",
  "Fineline",
  "Otro",
]

const SIZE_OPTIONS = [
  { value: "small", label: "Pequeño (<5 cm)" },
  { value: "medium", label: "Mediano (5–15 cm)" },
  { value: "large", label: "Grande (15–30 cm)" },
  { value: "xlarge", label: "Extra grande (>30 cm)" },
]

const DURATION_OPTIONS = [
  { value: 60, label: "1h" },
  { value: 90, label: "1.5h" },
  { value: 120, label: "2h" },
  { value: 150, label: "2.5h" },
  { value: 180, label: "3h" },
  { value: 210, label: "3.5h" },
  { value: 240, label: "4h" },
  { value: 270, label: "4.5h" },
  { value: 300, label: "5h" },
  { value: 360, label: "6h" },
  { value: 420, label: "7h" },
  { value: 480, label: "8h" },
  { value: 540, label: "9h" },
  { value: 600, label: "10h" },
]

const LABEL_CLASS = "block text-xs text-foreground-muted uppercase tracking-wide mb-1"
const INPUT_CLASS =
  "w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionRow {
  sessionNumber: number
  durationMinutes: number
}

interface FormErrors {
  style?: string
  size?: string
  placement?: string
  description?: string
  sessions?: string
}

// ─── TattooPlanForm ───────────────────────────────────────────────────────────

export function TattooPlanForm({
  appointmentId,
  onSuccess,
  onCancel,
}: {
  appointmentId: string
  onSuccess: (plan: { id: string }) => void
  onCancel: () => void
}) {
  const [style, setStyle] = useState("")
  const [size, setSize] = useState("")
  const [placement, setPlacement] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [sessions, setSessions] = useState<SessionRow[]>([
    { sessionNumber: 1, durationMinutes: 60 },
  ])
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!style) newErrors.style = "El estilo es obligatorio"
    if (!size) newErrors.size = "El tamaño es obligatorio"
    if (!placement.trim()) newErrors.placement = "El placement es obligatorio"
    if (description.trim().length < 20)
      newErrors.description = "La descripción debe tener al menos 20 caracteres"
    if (sessions.length === 0) newErrors.sessions = "Debe haber al menos una sesión"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleAddSession() {
    if (sessions.length >= 10) return
    setSessions((prev) => [...prev, { sessionNumber: prev.length + 1, durationMinutes: 60 }])
  }

  function handleRemoveSession(index: number) {
    if (sessions.length <= 1) return
    setSessions((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((s, i) => ({ ...s, sessionNumber: i + 1 }))
    })
  }

  function handleDurationChange(index: number, value: number) {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, durationMinutes: value } : s)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError(null)

    const payload: CreateTattooPlanInput = {
      style,
      size,
      placement: placement.trim(),
      description: description.trim(),
      notes: notes.trim() || undefined,
      sessions,
    }

    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/tattoo-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al guardar el plan")
      }
      onSuccess(body.data)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Formulario de plan de tatuaje">
      <h4 className="text-sm font-semibold text-foreground mb-4">Nuevo plan de tatuaje</h4>

      {/* ── Estilo ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <label htmlFor="plan-style" className={LABEL_CLASS}>
          Estilo <span aria-hidden="true">*</span>
        </label>
        <select
          id="plan-style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className={INPUT_CLASS}
          aria-required="true"
          aria-invalid={!!errors.style}
          aria-describedby={errors.style ? "plan-style-error" : undefined}
        >
          <option value="">Selecciona un estilo</option>
          {STYLE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.style && (
          <p id="plan-style-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.style}
          </p>
        )}
      </div>

      {/* ── Tamaño ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <label htmlFor="plan-size" className={LABEL_CLASS}>
          Tamaño <span aria-hidden="true">*</span>
        </label>
        <select
          id="plan-size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className={INPUT_CLASS}
          aria-required="true"
          aria-invalid={!!errors.size}
          aria-describedby={errors.size ? "plan-size-error" : undefined}
        >
          <option value="">Selecciona un tamaño</option>
          {SIZE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.size && (
          <p id="plan-size-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.size}
          </p>
        )}
      </div>

      {/* ── Placement ──────────────────────────────────────────── */}
      <div className="mb-3">
        <label htmlFor="plan-placement" className={LABEL_CLASS}>
          Placement <span aria-hidden="true">*</span>
        </label>
        <input
          id="plan-placement"
          type="text"
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          placeholder="Ej. Antebrazo izquierdo"
          className={INPUT_CLASS}
          aria-required="true"
          aria-invalid={!!errors.placement}
          aria-describedby={errors.placement ? "plan-placement-error" : undefined}
        />
        {errors.placement && (
          <p id="plan-placement-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.placement}
          </p>
        )}
      </div>

      {/* ── Descripción ────────────────────────────────────────── */}
      <div className="mb-3">
        <label htmlFor="plan-description" className={LABEL_CLASS}>
          Descripción <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="plan-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Descripción detallada del diseño acordado (mín. 20 caracteres)"
          className={INPUT_CLASS}
          aria-required="true"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "plan-description-error" : undefined}
        />
        {errors.description && (
          <p id="plan-description-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.description}
          </p>
        )}
      </div>

      {/* ── Notas del artista ──────────────────────────────────── */}
      <div className="mb-4">
        <label htmlFor="plan-notes" className={LABEL_CLASS}>
          Notas del artista (opcional)
        </label>
        <textarea
          id="plan-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Instrucciones especiales para el cliente…"
          className={INPUT_CLASS}
        />
      </div>

      {/* ── Sesiones ───────────────────────────────────────────── */}
      <div className="mb-4">
        <p className={LABEL_CLASS}>
          Sesiones <span aria-hidden="true">*</span>
        </p>
        <div className="space-y-2 mb-2" role="list" aria-label="Sesiones del plan">
          {sessions.map((session, index) => (
            <div
              key={index}
              role="listitem"
              className="flex items-center gap-2 rounded border border-border bg-surface/50 px-3 py-2"
            >
              <span className="text-sm text-foreground-secondary w-20 shrink-0">
                Sesión {session.sessionNumber}
              </span>
              <select
                value={session.durationMinutes}
                onChange={(e) => handleDurationChange(index, Number(e.target.value))}
                aria-label={`Duración de la sesión ${session.sessionNumber}`}
                className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSession(index)}
                  aria-label={`Eliminar sesión ${session.sessionNumber}`}
                  className="text-foreground-muted hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.sessions && (
          <p role="alert" className="text-xs text-destructive mb-2">
            {errors.sessions}
          </p>
        )}
        {sessions.length < 10 && (
          <Button type="button" variant="outline" size="sm" onClick={handleAddSession}>
            <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Añadir sesión
          </Button>
        )}
      </div>

      {/* ── API Error ──────────────────────────────────────────── */}
      {apiError && (
        <p role="alert" className="text-xs text-destructive mb-3">
          {apiError}
        </p>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading} aria-label="Guardar plan">
          {loading ? "Guardando…" : "Guardar plan"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
