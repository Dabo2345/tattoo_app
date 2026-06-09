import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  AppointmentManager,
  type AppointmentData,
} from "@/modules/booking/components/appointment-manager"

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Gestión de Cita",
  robots: { index: false, follow: false },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ValidResult {
  ok: true
  appointment: AppointmentData
}

interface ErrorResult {
  ok: false
  expired: boolean
}

async function fetchMagicLink(token: string): Promise<ValidResult | ErrorResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/magic-links/${token}`,
      { cache: "no-store" }
    )
    if (res.status === 410) return { ok: false, expired: true }
    if (!res.ok) return { ok: false, expired: false }
    const body = await res.json()
    return { ok: true, appointment: body.data.appointment as AppointmentData }
  } catch {
    return { ok: false, expired: false }
  }
}

// ─── Subviews ─────────────────────────────────────────────────────────────────

function ExpiredView() {
  return (
    <div className="text-center">
      <p className="text-4xl mb-4" aria-hidden="true">
        🔗
      </p>
      <h1 className="text-h2 text-foreground mb-3">Enlace expirado</h1>
      <p className="text-body text-foreground-secondary mb-8">
        Este enlace de gestión ha expirado. Los enlaces tienen una validez de 2 horas.
        <br />
        Solicita uno nuevo introduciendo tu email.
      </p>
      <Button asChild variant="outline">
        <Link href="mailto:info@tattoostudio.com">Contactar con el estudio</Link>
      </Button>
    </div>
  )
}

function ErrorView() {
  return (
    <div className="text-center">
      <p className="text-4xl mb-4" aria-hidden="true">
        ⚠️
      </p>
      <h1 className="text-h2 text-foreground mb-3">Enlace no válido</h1>
      <p className="text-body text-foreground-secondary mb-8">
        No hemos podido validar este enlace. Es posible que ya no sea válido o que haya un error.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ token: string }>
}

export default async function MagicLinkPage({ params }: Props) {
  const { token } = await params
  const result = await fetchMagicLink(token)

  return (
    <section className="max-w-xl mx-auto px-6 py-16 md:py-24">
      {!result.ok && result.expired && <ExpiredView />}
      {!result.ok && !result.expired && <ErrorView />}
      {result.ok && <AppointmentManager appointment={result.appointment} />}
    </section>
  )
}
