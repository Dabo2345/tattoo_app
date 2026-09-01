"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, X, CalendarDays, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TattooPlanForm } from "@/modules/booking/components/tattoo-plan-form"
import { TattooPlanStatus } from "@/modules/booking/components/tattoo-plan-status"
import type { TattooPlanWithSessions } from "@/modules/booking/types/tattoo-plan"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Appointment {
  id: string
  type: "CONSULTATION" | "TATTOO_SESSION"
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  startsAt: string
  endsAt: string
  client: { name: string; email: string; phone?: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const STATUS_LABELS: Record<Appointment["status"], string> = {
  CONFIRMED: "Confirmada",
  PENDING_PAYMENT: "Pago pendiente",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No presentado",
}

const TYPE_LABELS: Record<Appointment["type"], string> = {
  CONSULTATION: "Consulta",
  TATTOO_SESSION: "Sesión de tatuaje",
}

const STATUS_CARD_STYLES: Record<Appointment["status"], string> = {
  CONFIRMED: "text-green-400 border-green-500/40 bg-green-500/10",
  PENDING_PAYMENT: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  CANCELLED: "text-red-400/60 border-red-500/20 bg-red-500/5 opacity-60",
  COMPLETED: "text-foreground-muted border-border bg-surface",
  NO_SHOW: "text-red-400 border-red-500/40 bg-red-500/10",
}

const ACTIONABLE_STATUSES: Appointment["status"][] = ["PENDING_PAYMENT", "CONFIRMED"]
const SESSION_LINK_STATUSES: Appointment["status"][] = ["CONFIRMED", "COMPLETED"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

function getDaysOfWeek(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

function isCurrentWeek(monday: Date): boolean {
  return isSameDay(monday, getMondayOfWeek(new Date()))
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const from = monday.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
  const to = sunday.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
  return `${from} – ${to}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  isSelected,
  onClick,
}: {
  appointment: Appointment
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "w-full text-left rounded-md border p-2 text-xs transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        STATUS_CARD_STYLES[appointment.status],
        isSelected && "ring-2 ring-accent ring-offset-1 ring-offset-background"
      )}
    >
      <p className="font-medium truncate">{appointment.client.name}</p>
      <p className="opacity-80 mt-0.5">
        {formatTime(appointment.startsAt)} · {TYPE_LABELS[appointment.type]}
      </p>
    </button>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

type PanelView =
  | "detail"
  | "cancel-confirm"
  | "reschedule-form"
  | "reschedule-confirm"
  | "session-link-form"
  | "session-link-result"
  | "tattoo-plan-form"
  | "tattoo-plan-status"

function DetailPanel({
  appointment,
  onClose,
  onMutate,
}: {
  appointment: Appointment
  onClose: () => void
  onMutate: () => void
}) {
  const [view, setView] = useState<PanelView>("detail")
  const [newStartAt, setNewStartAt] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [sessionNotes, setSessionNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tattooPlan, setTattooPlan] = useState<TattooPlanWithSessions | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const isActionable = ACTIONABLE_STATUSES.includes(appointment.status)
  const canGenerateSessionLink =
    appointment.type === "CONSULTATION" && SESSION_LINK_STATUSES.includes(appointment.status)
  const canViewPlan = appointment.type === "CONSULTATION" && appointment.status === "CONFIRMED"

  async function loadTattooPlan() {
    setPlanLoading(true)
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}/tattoo-plan`)
      const body = await res.json()
      if (res.status === 404 || !body.success) {
        setTattooPlan(null)
        setView("tattoo-plan-form")
      } else {
        setTattooPlan(body.data)
        setView("tattoo-plan-status")
      }
    } catch {
      setTattooPlan(null)
      setView("tattoo-plan-form")
    } finally {
      setPlanLoading(false)
    }
  }

  async function handleCancel() {
    setActionLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}/cancel`, {
        method: "POST",
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al cancelar la cita")
      }
      onMutate()
      onClose()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error de red")
      setActionLoading(false)
    }
  }

  async function handleReschedule() {
    setActionLoading(true)
    setActionError(null)
    try {
      // datetime-local returns local-time strings without timezone info.
      // The system operates in UTC, so we interpret the value as UTC directly.
      const suffix = newStartAt.length === 16 ? ":00.000Z" : ".000Z"
      const res = await fetch(`/api/admin/appointments/${appointment.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStartAt: newStartAt + suffix }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al reprogramar la cita")
      }
      onMutate()
      onClose()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error de red")
      setActionLoading(false)
    }
  }

  async function handleGenerateSessionLink() {
    setActionLoading(true)
    setActionError(null)
    try {
      const res = await fetch("/api/admin/session-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: appointment.id,
          durationMinutes: parseInt(durationMinutes, 10),
          notes: sessionNotes || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al generar el SessionLink")
      }
      setView("session-link-result")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error de red")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div
      className="mt-6 rounded-lg border border-border bg-surface p-5 relative"
      role="region"
      aria-label="Detalle de cita"
    >
      <button
        onClick={onClose}
        aria-label="Cerrar detalle"
        className="absolute top-3 right-3 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* ── Detail view ──────────────────────────────────────────── */}
      {view === "detail" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Cliente</p>
              <p className="text-sm font-medium text-foreground">{appointment.client.name}</p>
              <p className="text-xs text-foreground-secondary">{appointment.client.email}</p>
              {appointment.client.phone && (
                <p className="text-xs text-foreground-secondary">{appointment.client.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">
                Fecha y hora
              </p>
              <p className="text-sm text-foreground capitalize">
                {formatDateTime(appointment.startsAt)}
              </p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                hasta {formatTime(appointment.endsAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Tipo</p>
              <p className="text-sm text-foreground">{TYPE_LABELS[appointment.type]}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Estado</p>
              <p
                className={cn(
                  "text-sm font-medium",
                  STATUS_CARD_STYLES[appointment.status].split(" ")[0]
                )}
              >
                {STATUS_LABELS[appointment.status]}
              </p>
            </div>
          </div>

          {(isActionable || canGenerateSessionLink || canViewPlan) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              {isActionable && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setView("reschedule-form")}>
                    Reprogramar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                    onClick={() => setView("cancel-confirm")}
                  >
                    Cancelar cita
                  </Button>
                </>
              )}
              {canGenerateSessionLink && (
                <Button variant="outline" size="sm" onClick={() => setView("session-link-form")}>
                  Generar SessionLink
                </Button>
              )}
              {canViewPlan && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTattooPlan}
                  disabled={planLoading}
                  aria-label="Ver o crear plan de tatuaje"
                >
                  {planLoading ? "Cargando…" : "Plan de tatuaje"}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Cancel confirmation ───────────────────────────────────── */}
      {view === "cancel-confirm" && (
        <div>
          <p className="text-sm font-medium text-foreground mb-1">
            ¿Cancelar la cita de {appointment.client.name}?
          </p>
          <p className="text-xs text-foreground-secondary mb-4">
            Esta acción no se puede deshacer. El depósito puede ser retenido si la cita es en menos
            de 4 días.
          </p>
          {actionError && (
            <p role="alert" className="text-xs text-destructive mb-3">
              {actionError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleCancel}
              disabled={actionLoading}
              aria-label="Confirmar cancelación"
            >
              {actionLoading ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setView("detail")
                setActionError(null)
              }}
              disabled={actionLoading}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* ── Reschedule form ───────────────────────────────────────── */}
      {view === "reschedule-form" && (
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Nueva fecha y hora para {appointment.client.name}
          </p>
          <div className="mb-4">
            <label
              htmlFor="new-start-at"
              className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
            >
              Fecha y hora
            </label>
            <input
              id="new-start-at"
              type="datetime-local"
              value={newStartAt}
              onChange={(e) => setNewStartAt(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setView("reschedule-confirm")
                setActionError(null)
              }}
              disabled={!newStartAt}
            >
              Siguiente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setView("detail")
                setActionError(null)
              }}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* ── Reschedule confirmation ───────────────────────────────── */}
      {view === "reschedule-confirm" && (
        <div>
          <p className="text-sm font-medium text-foreground mb-1">¿Confirmar reprogramación?</p>
          <p className="text-xs text-foreground-secondary mb-1">
            Cita actual:{" "}
            <span className="text-foreground capitalize">
              {formatDateTime(appointment.startsAt)}
            </span>
          </p>
          <p className="text-xs text-foreground-secondary mb-4">
            Nueva fecha: <span className="text-foreground">{newStartAt.replace("T", " ")}</span>
          </p>
          {actionError && (
            <p role="alert" className="text-xs text-destructive mb-3">
              {actionError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleReschedule}
              disabled={actionLoading}
              aria-label="Confirmar reprogramación"
            >
              {actionLoading ? "Reprogramando..." : "Confirmar reprogramación"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setView("reschedule-form")
                setActionError(null)
              }}
              disabled={actionLoading}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* ── SessionLink form ─────────────────────────────────────── */}
      {view === "session-link-form" && (
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Generar SessionLink para {appointment.client.name}
          </p>
          <div className="space-y-3 mb-4">
            <div>
              <label
                htmlFor="session-duration"
                className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
              >
                Duración (minutos)
              </label>
              <input
                id="session-duration"
                type="number"
                min={30}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="session-notes"
                className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
              >
                Notas del artista (opcional)
              </label>
              <input
                id="session-notes"
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                maxLength={1000}
                placeholder="Instrucciones, referencias..."
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
          {actionError && (
            <p role="alert" className="text-xs text-destructive mb-3">
              {actionError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleGenerateSessionLink}
              disabled={actionLoading || !durationMinutes}
              aria-label="Generar link"
            >
              {actionLoading ? "Generando..." : "Generar link"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setView("detail")
                setActionError(null)
              }}
              disabled={actionLoading}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* ── SessionLink result ───────────────────────────────────── */}
      {view === "session-link-result" && (
        <div className="text-center py-4">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground mb-1">Enlace enviado</p>
          <p className="text-xs text-foreground-secondary mb-4">
            El cliente recibirá el enlace de reserva en su email.
          </p>
          <Button variant="outline" size="sm" onClick={() => setView("detail")}>
            Volver al detalle
          </Button>
        </div>
      )}

      {/* ── Tattoo plan form ─────────────────────────────────────── */}
      {view === "tattoo-plan-form" && (
        <div>
          <TattooPlanForm
            appointmentId={appointment.id}
            onSuccess={(plan) => {
              setTattooPlan(plan as TattooPlanWithSessions)
              setView("tattoo-plan-status")
            }}
            onCancel={() => setView("detail")}
          />
        </div>
      )}

      {/* ── Tattoo plan status ───────────────────────────────────── */}
      {view === "tattoo-plan-status" && tattooPlan && (
        <div>
          <TattooPlanStatus plan={tattooPlan} />
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setView("detail")}>
              Volver al detalle
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WeeklyAgenda ─────────────────────────────────────────────────────────────

export function WeeklyAgenda() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const fetchAppointments = useCallback(async (monday: Date) => {
    setLoading(true)
    setError(null)
    setSelectedAppointment(null)

    const from = monday.toISOString()
    const to = addDays(monday, 6).toISOString()

    try {
      const res = await fetch(`/api/admin/calendar?from=${from}&to=${to}`)
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al cargar la agenda")
      }
      setAppointments(body.data.appointments ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments(currentWeekStart)
  }, [currentWeekStart, fetchAppointments])

  function goToPrevWeek() {
    setCurrentWeekStart((d) => addDays(d, -7))
  }

  function goToNextWeek() {
    setCurrentWeekStart((d) => addDays(d, 7))
  }

  function goToCurrentWeek() {
    setCurrentWeekStart(getMondayOfWeek(new Date()))
  }

  const days = getDaysOfWeek(currentWeekStart)
  const isThisWeek = isCurrentWeek(currentWeekStart)

  return (
    <div>
      {/* ── Navigation header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevWeek}
            aria-label="Semana anterior"
            className="p-1.5 rounded border border-border text-foreground-secondary hover:text-foreground hover:border-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-sm font-medium text-foreground capitalize min-w-[14rem] text-center">
            {formatWeekRange(currentWeekStart)}
          </span>
          <button
            onClick={goToNextWeek}
            aria-label="Semana siguiente"
            className="p-1.5 rounded border border-border text-foreground-secondary hover:text-foreground hover:border-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {!isThisWeek && (
          <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
            Hoy
          </Button>
        )}
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────── */}
      {loading && (
        <div aria-label="Cargando agenda" className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-7 rounded bg-muted animate-pulse" />
              <div className="h-12 rounded bg-muted animate-pulse" />
              <div className="h-12 rounded bg-muted animate-pulse opacity-50" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchAppointments(currentWeekStart)}>
            Reintentar
          </Button>
        </div>
      )}

      {/* ── Weekly grid ──────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-7 gap-2 overflow-x-auto">
          {days.map((day, i) => {
            const dayAppointments = appointments
              .filter((a) => isSameDay(new Date(a.startsAt), day))
              .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

            const isToday = isSameDay(day, new Date())

            return (
              <div key={i} className="min-w-0">
                <div
                  className={cn(
                    "text-xs font-medium text-center py-1.5 mb-2 rounded",
                    isToday
                      ? "bg-accent text-foreground"
                      : "text-foreground-secondary bg-surface border border-border"
                  )}
                >
                  {DAY_NAMES[i]} {day.getUTCDate()}
                </div>

                <div className="space-y-1.5">
                  {dayAppointments.length === 0 ? (
                    <p className="text-[10px] text-foreground-muted text-center py-3">—</p>
                  ) : (
                    dayAppointments.map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        isSelected={selectedAppointment?.id === apt.id}
                        onClick={() =>
                          setSelectedAppointment((prev) => (prev?.id === apt.id ? null : apt))
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Empty week state ─────────────────────────────────────────── */}
      {!loading && !error && appointments.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
          <CalendarDays className="h-8 w-8 text-foreground-muted" aria-hidden="true" />
          <p className="text-sm text-foreground-secondary">No hay citas esta semana.</p>
        </div>
      )}

      {/* ── Detail panel ─────────────────────────────────────────────── */}
      {selectedAppointment && (
        <DetailPanel
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onMutate={() => fetchAppointments(currentWeekStart)}
        />
      )}
    </div>
  )
}
