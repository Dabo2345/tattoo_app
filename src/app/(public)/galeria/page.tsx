import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Galería",
}

export default function GaleriaPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-h1 text-foreground mb-4">Galería</h1>
      <p className="text-foreground-secondary">Portfolio de trabajos — próximamente.</p>
    </section>
  )
}
