import type { Metadata } from "next"
import { WeeklyAgenda } from "@/components/admin/weekly-agenda"

export const metadata: Metadata = {
  title: "Dashboard Admin",
  robots: { index: false, follow: false },
}

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">Agenda</h1>
        <p className="text-sm text-foreground-secondary mt-1">Vista semanal de citas y sesiones.</p>
      </div>
      <WeeklyAgenda />
    </div>
  )
}
