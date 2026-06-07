import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reservar Consulta",
}

export default function ReservarPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-h1 text-foreground mb-4">Reservar Consulta</h1>
      <p className="text-foreground-secondary">Sistema de reservas — próximamente.</p>
    </section>
  )
}
