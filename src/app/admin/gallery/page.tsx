import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Galería Admin",
  robots: { index: false, follow: false },
}

export default function AdminGalleryPage() {
  return (
    <div>
      <h1 className="text-h2 text-foreground mb-2">Galería</h1>
      <p className="text-foreground-secondary">Gestión de galería — próximamente (issue #043).</p>
    </div>
  )
}
