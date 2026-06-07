import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reserva de Sesión",
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function SessionLinkPage({ params }: Props) {
  const { token } = await params

  return (
    <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="text-h2 text-foreground mb-4">Reserva de Sesión</h1>
      <p className="text-foreground-secondary">Validando enlace — próximamente.</p>
      <p className="text-foreground-muted text-sm mt-4 font-mono">{token}</p>
    </section>
  )
}
