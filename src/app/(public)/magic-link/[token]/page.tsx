import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gestión de Cita",
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function MagicLinkPage({ params }: Props) {
  const { token } = await params

  return (
    <section className="max-w-xl mx-auto px-6 py-24 text-center">
      <h1 className="text-h2 text-foreground mb-4">Gestión de Cita</h1>
      <p className="text-foreground-secondary">Validando enlace — próximamente.</p>
      <p className="text-foreground-muted text-sm mt-4 font-mono">{token}</p>
    </section>
  )
}
