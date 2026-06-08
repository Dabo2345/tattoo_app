import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Artista",
}

export default function PerfilPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-h1 text-foreground mb-4">Artista</h1>
      <p className="text-foreground-secondary">Perfil del artista — próximamente.</p>
    </section>
  )
}
