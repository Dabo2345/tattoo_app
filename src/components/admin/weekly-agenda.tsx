"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, X, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

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

function DetailPanel({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
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
          <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">Fecha y hora</p>
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
        />
      )}
    </div>
  )
}
