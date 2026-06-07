import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard Admin",
  robots: { index: false, follow: false },
}

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-h2 text-foreground mb-2">Dashboard</h1>
      <p className="text-foreground-secondary">Agenda semanal — próximamente (issue #038).</p>
    </div>
  )
}
