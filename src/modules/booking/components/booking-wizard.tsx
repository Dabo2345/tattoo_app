"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { consultationSchema, type ConsultationFormData } from "../schemas/consultation-schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSlot {
  startsAt: string
  endsAt: string
}

type WizardStep = "date" | "slot" | "form" | "submitting" | "error"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: WizardStep }) {
  const steps: { id: WizardStep; label: string }[] = [
    { id: "date", label: "Fecha" },
    { id: "slot", label: "Horario" },
    { id: "form", label: "Tus datos" },
  ]
  const order: WizardStep[] = ["date", "slot", "form", "submitting", "error"]
  const currentIdx = order.indexOf(current)

  return (
    <ol className="flex items-center gap-2 mb-10" aria-label="Progreso de reserva">
      {steps.map((step, i) => {
        const stepIdx = order.indexOf(step.id)
        const done = stepIdx < currentIdx
        const active = stepIdx === currentIdx

        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                active && "bg-accent text-foreground",
                done && "bg-accent/30 text-accent",
                !active && !done && "bg-surface border border-border text-foreground-muted"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "text-sm hidden sm:inline",
                active ? "text-foreground font-medium" : "text-foreground-muted"
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-border mx-1" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}

// ─── Step 1: Date ─────────────────────────────────────────────────────────────

function DateStep({ onNext }: { onNext: (date: string) => void }) {
  const [selectedDate, setSelectedDate] = useState("")

  return (
    <div>
      <h2 className="text-h3 text-foreground mb-2">Selecciona una fecha</h2>
      <p className="text-sm text-foreground-secondary mb-6">
        Elige el día que prefieres para tu consulta.
      </p>

      <label htmlFor="booking-date" className="block text-sm font-medium text-foreground mb-2">
        Fecha de la consulta
      </label>
      <input
        id="booking-date"
        type="date"
        value={selectedDate}
        min={todayISODate()}
        onChange={(e) => setSelectedDate(e.target.value)}
        aria-required="true"
        className={cn(
          "w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm",
          "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "[color-scheme:dark]"
        )}
      />

      <div className="mt-8 flex justify-end">
        <Button onClick={() => onNext(selectedDate)} disabled={!selectedDate} size="lg">
          Siguiente — Ver horarios
        </Button>
      </div>
    </div>
  )
}

// ─── Step 2: Slot ─────────────────────────────────────────────────────────────

function SlotStep({
  date,
  onNext,
  onBack,
}: {
  date: string
  onNext: (slot: TimeSlot) => void
  onBack: () => void
}) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<TimeSlot | null>(null)

  // Fetch slots on mount
  useEffect(() => {
    const from = new Date(date + "T00:00:00.000Z")
    const to = new Date(date + "T23:59:59.999Z")
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      type: "consultation",
    })

    fetch(`/api/availability?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((body) => setSlots(body.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [date])

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div>
      <h2 className="text-h3 text-foreground mb-1">Elige un horario</h2>
      <p className="text-sm text-foreground-secondary mb-6 capitalize">{dateLabel}</p>

      {loading && (
        <div
          aria-label="Cargando horarios disponibles"
          className="grid grid-cols-3 gap-2"
          aria-busy="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive">
          No se pudo cargar la disponibilidad. Inténtalo de nuevo.
        </p>
      )}

      {!loading && !error && slots.length === 0 && (
        <p className="text-sm text-foreground-secondary">
          No hay horarios disponibles para este día. Por favor, elige otra fecha.
        </p>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2" role="list" aria-label="Horarios disponibles">
          {slots.map((slot) => {
            const isSelected = selected?.startsAt === slot.startsAt
            return (
              <button
                key={slot.startsAt}
                role="listitem"
                onClick={() => setSelected(slot)}
                aria-pressed={isSelected}
                className={cn(
                  "h-10 rounded-md border text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-accent bg-accent text-foreground"
                    : "border-border bg-surface text-foreground hover:border-accent"
                )}
              >
                {formatTime(slot.startsAt)}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={() => selected && onNext(selected)} disabled={!selected} size="lg">
          Siguiente — Tus datos
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Form ─────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<keyof ConsultationFormData, string>>

function ConsultationForm({
  date,
  slot,
  onBack,
}: {
  date: string
  slot: TimeSlot
  onBack: () => void
}) {
  const [form, setForm] = useState<ConsultationFormData>({
    name: "",
    email: "",
    phone: "",
    tattooDescription: "",
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function update(field: keyof ConsultationFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = consultationSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ConsultationFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          startsAt: slot.startsAt,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message ?? "Error al crear la reserva")
      }
      window.location.href = body.data.stripeCheckoutUrl
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error inesperado. Inténtalo de nuevo.")
      setSubmitting(false)
    }
  }

  const slotLabel = formatTime(slot.startsAt)
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="text-h3 text-foreground mb-1">Tus datos</h2>
      <p className="text-sm text-foreground-secondary mb-6 capitalize">
        {dateLabel} · {slotLabel}
      </p>

      <div className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
            Nombre completo <span aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="Tu nombre"
            className={cn(
              "w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground",
              "placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.name ? "border-destructive" : "border-border"
            )}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="tu@email.com"
            className={cn(
              "w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground",
              "placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.email ? "border-destructive" : "border-border"
            )}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
            Teléfono <span aria-hidden="true">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            placeholder="+34 600 000 000"
            className={cn(
              "w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground",
              "placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.phone ? "border-destructive" : "border-border"
            )}
          />
          {errors.phone && (
            <p id="phone-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="tattooDescription"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Describe tu idea <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="tattooDescription"
            value={form.tattooDescription}
            onChange={(e) => update("tattooDescription", e.target.value)}
            aria-invalid={!!errors.tattooDescription}
            aria-describedby={errors.tattooDescription ? "desc-error" : undefined}
            placeholder="Cuéntanos qué quieres tatuar, dónde, el estilo aproximado..."
            rows={4}
            className={cn(
              "w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground resize-none",
              "placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              errors.tattooDescription ? "border-destructive" : "border-border"
            )}
          />
          <div className="flex justify-between items-start mt-1">
            {errors.tattooDescription ? (
              <p id="desc-error" role="alert" className="text-xs text-destructive">
                {errors.tattooDescription}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-foreground-muted tabular-nums">
              {form.tattooDescription.length}/1000
            </span>
          </div>
        </div>
      </div>

      {submitError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Atrás
        </Button>
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? "Procesando…" : "Ir al pago"}
        </Button>
      </div>
    </form>
  )
}

// ─── BookingWizard ────────────────────────────────────────────────────────────

export function BookingWizard() {
  const [step, setStep] = useState<WizardStep>("date")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  return (
    <div className="w-full max-w-xl mx-auto" aria-label="Asistente de reserva">
      <StepIndicator current={step} />

      {step === "date" && (
        <DateStep
          onNext={(date) => {
            setSelectedDate(date)
            setStep("slot")
          }}
        />
      )}

      {step === "slot" && selectedDate && (
        <SlotStep
          date={selectedDate}
          onNext={(slot) => {
            setSelectedSlot(slot)
            setStep("form")
          }}
          onBack={() => setStep("date")}
        />
      )}

      {step === "form" && selectedDate && selectedSlot && (
        <ConsultationForm date={selectedDate} slot={selectedSlot} onBack={() => setStep("slot")} />
      )}
    </div>
  )
}
