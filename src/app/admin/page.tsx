"use client"

import { useState } from "react"
import { WeeklyAgenda } from "@/components/admin/weekly-agenda"
import { BlockedPeriodForm } from "@/components/admin/blocked-period-form"
import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"

export default function AdminDashboardPage() {
  const [showBlockedForm, setShowBlockedForm] = useState(false)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2 text-foreground">Agenda</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Vista semanal de citas y sesiones.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBlockedForm((v) => !v)}
          aria-expanded={showBlockedForm}
          aria-controls="blocked-period-panel"
        >
          <Ban className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Bloquear período
        </Button>
      </div>

      {showBlockedForm && (
        <div id="blocked-period-panel" className="mb-6">
          <BlockedPeriodForm onClose={() => setShowBlockedForm(false)} />
        </div>
      )}

      <WeeklyAgenda />
    </div>
  )
}
