"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarPublicProps {
  /** Dates (ISO strings) that have at least one available slot */
  availableDates: string[]
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  /** Month currently displayed. Defaults to current month. */
  initialMonth?: Date
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Monday-based week offset (Mon=0 … Sun=6) */
function mondayOffset(date: Date): number {
  return (date.getDay() + 6) % 7
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarPublic({
  availableDates,
  selectedDate,
  onDateSelect,
  initialMonth,
}: CalendarPublicProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() =>
    startOfMonth(initialMonth ?? new Date())
  )

  const availableSet = React.useMemo(
    () => new Set(availableDates.map((d) => d.slice(0, 10))),
    [availableDates]
  )

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = mondayOffset(new Date(year, month, 1))

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const monthLabel = currentMonth.toLocaleString("es-ES", { month: "long", year: "numeric" })

  // Build grid cells: nulls for leading empty cells + day numbers
  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="w-full select-none">
      {/* Header: month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          aria-label="Mes anterior"
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium capitalize text-foreground">{monthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          aria-label="Mes siguiente"
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />
          }

          const date = new Date(year, month, day)
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isAvailable = availableSet.has(dateStr)
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
          const isToday = isSameDay(date, new Date())

          return (
            <button
              key={dateStr}
              onClick={() => isAvailable && onDateSelect(date)}
              disabled={!isAvailable}
              aria-label={`${day} ${monthLabel}${isAvailable ? ", disponible" : ", no disponible"}`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex h-9 w-full items-center justify-center rounded-md text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                // selected
                isSelected && "bg-primary text-primary-foreground font-medium",
                // available and not selected
                !isSelected &&
                  isAvailable &&
                  "hover:bg-accent hover:text-accent-foreground cursor-pointer",
                // today indicator
                isToday && !isSelected && "font-semibold text-foreground",
                // not available
                !isAvailable && "text-muted-foreground opacity-30 cursor-not-allowed"
              )}
            >
              {day}
              {isAvailable && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
