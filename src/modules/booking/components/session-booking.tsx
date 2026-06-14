"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Clock, CalendarDays, CheckCircle, AlertTriangle } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionLinkData {
  valid: boolean
  expiresAt: string
  durationMinutes: number
}

interface TimeSlot {
  startsAt: string
  endsAt: string
}

type BookingView = "date" | "slot" | "success" | "used" | "error"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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

function maxISODate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 60)
  return d.toISOString().slice(0, 10)
}

// ─── Session info card ────────────────────────────────────────────────────────

function SessionInfoCard({ data }: { data: SessionLinkData }) {
  return (
    <div className="rounded-lg bg-surface border border-border p-5 mb-6">
      <p className="text-xs text-foreground-muted uppercase tracking-wide mb-3">
        Sesión de tatuaje
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <Clock className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
          <span>{data.durationMinutes} minutos de sesión</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <CalendarDays className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
          <span>
            Enlace válido hasta{" "}
            <span className="text-foreground capitalize">{formatDate(data.expiresAt)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── SessionBooking ───────────────────────────────────────────────────────────

export function SessionBooking({ token, data }: { token: string; data: SessionLinkData }) {
  const [view, setView] = useState<BookingView>("date")
  const [selectedDate, setSelectedDate] = useState("")
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) return
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)

    const from = new Date(selectedDate + "T00:00:00.000Z")
    const to = new Date(selectedDate + "T23:59:59.999Z")
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      type: "tattoo_session",
    })

    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => setSlots(body.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate])

  async function handleBook() {
    if (!selectedSlot) return
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/session-links/${token}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: selectedSlot.startsAt }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        const code: string = body?.error?.code ?? ""
        if (code === "LINK_ALREADY_USED") {
          setView("used")
          return
        }
        throw new Error(body?.error?.message ?? "Error al reservar la sesión")
      }
      setView("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado")
      setView("error")
    } finally {
      setLoading(false)
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (view === "success") {
    return (
      <div className="text-center py-8" role="status">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-h3 text-foreground mb-2">¡Sesión reservada!</h2>
        <p className="text-sm text-foreground-secondary">
          Tu sesión de tatuaje ha quedado confirmada. Recibirás un email con todos los detalles.
        </p>
      </div>
    )
  }

  // ── Already used (durante el booking) ────────────────────────────────────

  if (view === "used") {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-h3 text-foreground mb-2">Enlace ya utilizado</h2>
        <p className="text-sm text-foreground-secondary">
          Este enlace de reserva ya ha sido utilizado. Cada enlace solo puede usarse una vez.
          <br />
          Si crees que es un error, contacta con el estudio.
        </p>
      </div>
    )
  }

  // ── Error (slot no disponible u otro) ─────────────────────────────────────

  if (view === "error") {
    return (
      <div>
        <SessionInfoCard data={data} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-destructive mb-4">{errorMsg}</p>
          <Button
            variant="outline"
            onClick={() => {
              setView("slot")
              setErrorMsg("")
            }}
          >
            Elegir otro horario
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SessionInfoCard data={data} />

      {/* ── Date picker ──────────────────────────────────────────────── */}
      {view === "date" && (
        <div>
          <h3 className="text-h4 text-foreground mb-4">Selecciona una fecha</h3>
          <label htmlFor="session-date" className="block text-sm font-medium text-foreground mb-2">
            Fecha de la sesión
          </label>
          <input
            id="session-date"
            type="date"
            value={selectedDate}
            min={todayISODate()}
            max={maxISODate()}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setView("slot")
            }}
            className={cn(
              "w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm",
              "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "[color-scheme:dark]"
            )}
          />
        </div>
      )}

      {/* ── Slot picker + inline confirm ─────────────────────────────── */}
      {view === "slot" && (
        <div>
          <h3 className="text-h4 text-foreground mb-2">Elige un horario</h3>
          <p className="text-sm text-foreground-secondary mb-4 capitalize">
            {selectedDate &&
              new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
          </p>

          {slotsLoading && (
            <div aria-label="Cargando horarios" className="grid grid-cols-3 gap-2 mb-4">
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

          {/* Inline confirmation */}
          {selectedSlot && (
            <div className="rounded-lg border border-border bg-surface/50 p-4 mb-4">
              <p className="text-sm text-foreground mb-3">
                <strong>Confirmar reserva:</strong>{" "}
                <span className="capitalize">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>{" "}
                a las {formatTime(selectedSlot.startsAt)}
              </p>
              <Button
                onClick={handleBook}
                disabled={loading}
                aria-label="Confirmar reserva de sesión"
                className="w-full sm:w-auto"
              >
                {loading ? "Reservando…" : "Confirmar reserva"}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setView("date")
              setSelectedSlot(null)
            }}
          >
            Cambiar fecha
          </Button>
        </div>
      )}
    </div>
  )
}
