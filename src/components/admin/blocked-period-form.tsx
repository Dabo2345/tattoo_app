"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, Plus, Trash2 } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlockedPeriod {
  id: string
  startsAt: string
  endsAt: string
  reason: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRange(startsAt: string, endsAt: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })
  return `${fmt(startsAt)} → ${fmt(endsAt)}`
}

// ─── BlockedPeriodForm ────────────────────────────────────────────────────────

export function BlockedPeriodForm({ onClose }: { onClose: () => void }) {
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [reason, setReason] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  const fetchPeriods = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch("/api/admin/blocked-periods")
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al cargar períodos")
      }
      setBlockedPeriods(body.data.blockedPeriods)
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Error de red")
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeriods()
  }, [fetchPeriods])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/admin/blocked-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          reason: reason || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al crear el período")
      }
      setStartsAt("")
      setEndsAt("")
      setReason("")
      await fetchPeriods()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error de red")
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteLoadingId(id)
    try {
      const res = await fetch(`/api/admin/blocked-periods/${id}`, { method: "DELETE" })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body?.error?.message ?? "Error al eliminar el período")
      }
      await fetchPeriods()
    } catch {
      // silently refresh to reflect current state
      await fetchPeriods()
    } finally {
      setDeleteLoadingId(null)
    }
  }

  return (
    <div
      className="rounded-lg border border-border bg-surface p-5 relative"
      role="region"
      aria-label="Gestión de períodos bloqueados"
    >
      <button
        onClick={onClose}
        aria-label="Cerrar gestión de períodos"
        className="absolute top-3 right-3 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <h2 className="text-sm font-semibold text-foreground mb-4">Períodos bloqueados</h2>

      {/* ── Create form ──────────────────────────────────────────── */}
      <form onSubmit={handleCreate} className="space-y-3 mb-6" aria-label="Crear período bloqueado">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="blocked-starts-at"
              className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
            >
              Inicio
            </label>
            <input
              id="blocked-starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="blocked-ends-at"
              className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
            >
              Fin
            </label>
            <input
              id="blocked-ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="blocked-reason"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Motivo (opcional)
          </label>
          <input
            id="blocked-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Vacaciones, cierre, evento..."
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {createError && (
          <p role="alert" className="text-xs text-destructive">
            {createError}
          </p>
        )}

        <Button type="submit" size="sm" disabled={createLoading || !startsAt || !endsAt}>
          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          {createLoading ? "Creando..." : "Bloquear período"}
        </Button>
      </form>

      {/* ── List ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-foreground-muted uppercase tracking-wide mb-2">
          Períodos activos
        </p>

        {listLoading && (
          <p className="text-xs text-foreground-secondary" aria-label="Cargando períodos">
            Cargando...
          </p>
        )}

        {!listLoading && listError && <p className="text-xs text-destructive">{listError}</p>}

        {!listLoading && !listError && blockedPeriods.length === 0 && (
          <p className="text-xs text-foreground-muted">No hay períodos bloqueados.</p>
        )}

        {!listLoading && !listError && blockedPeriods.length > 0 && (
          <ul className="space-y-2" aria-label="Lista de períodos bloqueados">
            {blockedPeriods.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-2 rounded border border-border bg-background p-2.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate">
                    {formatRange(p.startsAt, p.endsAt)}
                  </p>
                  {p.reason && (
                    <p className="text-foreground-secondary mt-0.5 truncate">{p.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleteLoadingId === p.id}
                  aria-label={`Eliminar período ${p.id}`}
                  className="shrink-0 text-foreground-muted hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
