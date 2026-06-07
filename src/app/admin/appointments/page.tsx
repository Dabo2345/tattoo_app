import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Citas Admin",
  robots: { index: false, follow: false },
}

export default function AdminAppointmentsPage() {
  return (
    <div>
      <h1 className="text-h2 text-foreground mb-2">Citas</h1>
      <p className="text-foreground-secondary">Gestión de citas — próximamente (issue #040).</p>
    </div>
  )
}
