"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentData {
  id: string
  type: "CONSULTATION" | "TATTOO_SESSION"
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  startsAt: string
  endsAt: string
  client: { name: string; email: string }
}

interface TimeSlot {
  startsAt: string
  endsAt: string
}

type ManagerView =
  | "detail"
  | "cancel-confirm"
  | "cancel-success"
  | "cancel-error"
  | "reschedule-date"
  | "reschedule-slot"
  | "reschedule-success"
  | "reschedule-error"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

const TYPE_LABELS: Record<AppointmentData["type"], string> = {
  CONSULTATION: "Consulta",
  TATTOO_SESSION: "Sesión de tatuaje",
}

const STATUS_LABELS: Record<AppointmentData["status"], string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No presentado",
}

// ─── Appointment detail card ──────────────────────────────────────────────────

function AppointmentCard({ appointment }: { appointment: AppointmentData }) {
  return (
    <div className="rounded-lg bg-surface border border-border p-5 mb-6">
      <p className="text-xs text-foreground-muted uppercase tracking-wide mb-3">
        {TYPE_LABELS[appointment.type]}
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2 text-sm text-foreground-secondary">
          <Calendar className="h-4 w-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
          <span className="capitalize">{formatDateTime(appointment.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <Clock className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
          <span>
            {formatTime(appointment.startsAt)} – {formatTime(appointment.endsAt)}
          </span>
        </div>
      </div>
      <p
        className={cn(
          "mt-3 text-xs font-medium",
          appointment.status === "CONFIRMED" && "text-green-500",
          appointment.status === "CANCELLED" && "text-destructive",
          appointment.status === "PENDING_PAYMENT" && "text-warning"
        )}
      >
        {STATUS_LABELS[appointment.status]}
      </p>
    </div>
  )
}

// ─── AppointmentManager ───────────────────────────────────────────────────────

export function AppointmentManager({ appointment }: { appointment: AppointmentData }) {
  const [view, setView] = useState<ManagerView>("detail")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Fetch slots when reschedule date changes
  useEffect(() => {
    if (!rescheduleDate) return
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)

    const from = new Date(rescheduleDate + "T00:00:00.000Z")
    const to = new Date(rescheduleDate + "T23:59:59.999Z")
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      type: appointment.type.toLowerCase(),
    })

    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => setSlots(body.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [rescheduleDate, appointment.type])

  // ── Cancel ────────────────────────────────────────────────────────────────

  async function handleCancel() {
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/cancel`, { method: "POST" })
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Error al cancelar")
      setView("cancel-success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado")
      setView("cancel-error")
    } finally {
      setLoading(false)
    }
  }

  // ── Reschedule ────────────────────────────────────────────────────────────

  async function handleReschedule() {
    if (!selectedSlot) return
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStartAt: selectedSlot.startsAt }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Error al reprogramar")
      setView("reschedule-success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado")
      setView("reschedule-error")
    } finally {
      setLoading(false)
    }
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  if (view === "cancel-success") {
    return (
      <div className="text-center py-8" role="status">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-h3 text-foreground mb-2">Cita cancelada</h2>
        <p className="text-sm text-foreground-secondary">
          Tu cita ha sido cancelada. Recibirás un email de confirmación.
        </p>
      </div>
    )
  }

  if (view === "reschedule-success") {
    return (
      <div className="text-center py-8" role="status">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-h3 text-foreground mb-2">Cita reprogramada</h2>
        <p className="text-sm text-foreground-secondary">
          Tu cita ha sido reprogramada. Recibirás un email con los nuevos detalles.
        </p>
      </div>
    )
  }

  if (view === "cancel-error" || view === "reschedule-error") {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-h3 text-foreground mb-2">Ha ocurrido un error</h2>
        <p className="text-sm text-destructive mb-6">{errorMsg}</p>
        <Button variant="outline" onClick={() => setView("detail")}>
          <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div>
      <AppointmentCard appointment={appointment} />

      {/* ── Detail view ─────────────────────────────────────────────── */}
      {view === "detail" && appointment.status === "CONFIRMED" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setView("reschedule-date")}>
            Reprogramar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setView("cancel-confirm")}
          >
            Cancelar cita
          </Button>
        </div>
      )}

      {view === "detail" && appointment.status !== "CONFIRMED" && (
        <p className="text-sm text-foreground-secondary text-center">
          Esta cita no puede modificarse en su estado actual.
        </p>
      )}

      {/* ── Cancel confirm ──────────────────────────────────────────── */}
      {view === "cancel-confirm" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm text-foreground mb-4">
            <strong>¿Confirmas la cancelación?</strong> Según la política de depósito, este podría
            no ser reembolsado si cancelas con menos de 48 horas de antelación.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setView("detail")}
              disabled={loading}
            >
              No, volver
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={loading}
              aria-label="Confirmar cancelación"
            >
              {loading ? "Cancelando…" : "Sí, cancelar"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Reschedule: date selection ───────────────────────────────── */}
      {view === "reschedule-date" && (
        <div>
          <h3 className="text-h4 text-foreground mb-4">Selecciona una nueva fecha</h3>
          <label
            htmlFor="reschedule-date"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Nueva fecha
          </label>
          <input
            id="reschedule-date"
            type="date"
            value={rescheduleDate}
            min={todayISODate()}
            onChange={(e) => {
              setRescheduleDate(e.target.value)
              setView("reschedule-slot")
            }}
            className={cn(
              "w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm",
              "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "[color-scheme:dark]"
            )}
          />
          <div className="mt-4">
            <Button variant="outline" onClick={() => setView("detail")}>
              Atrás
            </Button>
          </div>
        </div>
      )}

      {/* ── Reschedule: slot selection ──────────────────────────────── */}
      {view === "reschedule-slot" && (
        <div>
          <h3 className="text-h4 text-foreground mb-2">Elige un horario</h3>
          <p className="text-sm text-foreground-secondary mb-4 capitalize">
            {rescheduleDate &&
              new Date(rescheduleDate + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
          </p>

          {slotsLoading && (
            <div aria-label="Cargando horarios" className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!slotsLoading && slots.length === 0 && (
            <p className="text-sm text-foreground-secondary mb-4">
              No hay horarios disponibles para este día.
            </p>
          )}

          {!slotsLoading && slots.length > 0 && (
            <div
              className="grid grid-cols-3 gap-2 mb-4"
              role="list"
              aria-label="Horarios disponibles"
            >
              {slots.map((slot) => {
                const isSelected = selectedSlot?.startsAt === slot.startsAt
                return (
                  <button
                    key={slot.startsAt}
                    onClick={() => setSelectedSlot(slot)}
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

          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setView("reschedule-date")}>
              Atrás
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedSlot || loading}
              aria-label="Confirmar reprogramación"
            >
              {loading ? "Reprogramando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
