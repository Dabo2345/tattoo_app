"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { bookingApi, type TimeSlot } from "../api/booking-api"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlotPickerProps {
  date: Date
  selectedSlot?: string
  onSlotSelect: (slot: TimeSlot) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlotPicker({ date, selectedSlot, onSlotSelect }: SlotPickerProps) {
  const from = new Date(date)
  from.setUTCHours(0, 0, 0, 0)
  const to = new Date(date)
  to.setUTCHours(23, 59, 59, 999)

  const {
    data: slots,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["availability", date.toISOString().slice(0, 10)],
    queryFn: () => bookingApi.getAvailability(from, to),
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-label="Cargando slots">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar la disponibilidad. Inténtalo de nuevo.
      </p>
    )
  }

  if (!slots || slots.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay slots disponibles para este día.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2" role="list" aria-label="Slots disponibles">
      {slots.map((slot) => {
        const isSelected = slot.startsAt === selectedSlot
        return (
          <button
            key={slot.startsAt}
            role="listitem"
            onClick={() => onSlotSelect(slot)}
            aria-pressed={isSelected}
            className={cn(
              "h-10 rounded-md border text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-accent hover:border-accent"
            )}
          >
            {formatTime(slot.startsAt)}
          </button>
        )
      })}
    </div>
  )
}
