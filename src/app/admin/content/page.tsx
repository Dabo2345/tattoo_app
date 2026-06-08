import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contenido Admin",
  robots: { index: false, follow: false },
}

export default function AdminContentPage() {
  return (
    <div>
      <h1 className="text-h2 text-foreground mb-2">Contenido</h1>
      <p className="text-foreground-secondary">Edición de contenido — próximamente (issue #044).</p>
    </div>
  )
}
