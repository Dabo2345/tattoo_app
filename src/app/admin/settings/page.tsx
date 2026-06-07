import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ajustes Admin",
  robots: { index: false, follow: false },
}

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-h2 text-foreground mb-2">Ajustes</h1>
      <p className="text-foreground-secondary">
        Configuración del estudio — próximamente (issue #045).
      </p>
    </div>
  )
}
