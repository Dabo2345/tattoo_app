import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inicio",
}

export default function HomePage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24 text-center">
      <h1 className="text-display text-foreground mb-6">Tattoo Studio</h1>
      <p className="text-body-lg text-foreground-secondary max-w-xl mx-auto">
        Estudio de tatuajes profesional. Diseños únicos y personalizados.
      </p>
    </section>
  )
}
