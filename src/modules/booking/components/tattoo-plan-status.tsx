"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TattooPlanWithSessions } from "../types/tattoo-plan"

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  LINK_SENT: "Link enviado",
  BOOKED: "Reservada",
  COMPLETED: "Completada",
}

const SESSION_STATUS_STYLES: Record<string, string> = {
  PENDING: "text-foreground-muted border-border bg-surface",
  LINK_SENT: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  BOOKED: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  COMPLETED: "text-green-400 border-green-500/40 bg-green-500/10",
}

const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
}

const PLAN_STATUS_STYLES: Record<string, string> = {
  DRAFT: "text-foreground-muted",
  SENT: "text-amber-400",
  IN_PROGRESS: "text-blue-400",
  COMPLETED: "text-green-400",
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── TattooPlanStatus ─────────────────────────────────────────────────────────

export function TattooPlanStatus({ plan: initialPlan }: { plan: TattooPlanWithSessions }) {
  const [plan, setPlan] = useState(initialPlan)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  async function handleSend() {
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/admin/tattoo-plans/${plan.id}/send`, {
        method: "POST",
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al enviar el plan")
      }
      // Refresh plan status optimistically — mark as SENT without reload
      setPlan((prev) => ({
        ...prev,
        status: "SENT",
        sessions: prev.sessions.map((s) => ({ ...s, status: "LINK_SENT" as const })),
      }))
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Error de red")
    } finally {
      setSending(false)
    }
  }

  return (
    <div aria-label="Estado del plan de tatuaje">
      {/* ── Plan header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">Plan de tatuaje</h4>
        <span
          className={cn("text-xs font-medium", PLAN_STATUS_STYLES[plan.status])}
          aria-label={`Estado del plan: ${PLAN_STATUS_LABELS[plan.status]}`}
        >
          {PLAN_STATUS_LABELS[plan.status]}
        </span>
      </div>

      {/* ── Characteristics ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
        <div>
          <p className="text-xs text-foreground-muted uppercase tracking-wide mb-0.5">Estilo</p>
          <p className="text-foreground">{plan.style}</p>
        </div>
        <div>
          <p className="text-xs text-foreground-muted uppercase tracking-wide mb-0.5">Tamaño</p>
          <p className="text-foreground">{plan.size}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-foreground-muted uppercase tracking-wide mb-0.5">Placement</p>
          <p className="text-foreground">{plan.placement}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-foreground-muted uppercase tracking-wide mb-0.5">
            Descripción
          </p>
          <p className="text-foreground text-sm">{plan.description}</p>
        </div>
        {plan.notes && (
          <div className="col-span-2">
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-0.5">
              Notas del artista
            </p>
            <p className="text-foreground-secondary text-sm">{plan.notes}</p>
          </div>
        )}
      </div>

      {/* ── Sessions ───────────────────────────────────────────── */}
      <div className="mb-4">
        <p className="text-xs text-foreground-muted uppercase tracking-wide mb-2">Sesiones</p>
        <div className="space-y-1.5" role="list" aria-label="Sesiones del plan">
          {plan.sessions.map((session) => (
            <div
              key={session.id}
              role="listitem"
              className="flex items-center justify-between rounded border border-border bg-surface/50 px-3 py-2 text-sm"
            >
              <span className="text-foreground-secondary">Sesión {session.sessionNumber}</span>
              <span className="text-foreground-secondary">
                {formatDuration(session.durationMinutes)}
              </span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  SESSION_STATUS_STYLES[session.status]
                )}
                aria-label={`Estado: ${SESSION_STATUS_LABELS[session.status]}`}
              >
                {SESSION_STATUS_LABELS[session.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Send action (DRAFT only) ────────────────────────────── */}
      {plan.status === "DRAFT" && (
        <div>
          {sendError && (
            <p role="alert" className="text-xs text-destructive mb-2">
              {sendError}
            </p>
          )}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending}
            aria-label="Enviar plan al cliente"
          >
            {sending ? "Enviando…" : "Enviar al cliente"}
          </Button>
        </div>
      )}
    </div>
  )
}
