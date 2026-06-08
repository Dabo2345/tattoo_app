import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Estudio",
}

export default function EstudioPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-h1 text-foreground mb-4">Estudio</h1>
      <p className="text-foreground-secondary">Información del estudio — próximamente.</p>
    </section>
  )
}
