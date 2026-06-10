import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SessionBooking, type SessionLinkData } from "@/modules/booking/components/session-booking"

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Reserva de Sesión",
  robots: { index: false, follow: false },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type FetchResult = { ok: true; data: SessionLinkData } | { ok: false; reason: "expired" | "used" }

async function fetchSessionLink(token: string): Promise<FetchResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/session-links/${token}`,
      { cache: "no-store" }
    )
    if (res.status === 409) return { ok: false, reason: "used" }
    if (!res.ok) return { ok: false, reason: "expired" }
    const body = await res.json()
    return { ok: true, data: body.data as SessionLinkData }
  } catch {
    return { ok: false, reason: "expired" }
  }
}

// ─── Error views ─────────────────────────────────────────────────────────────

function ExpiredSessionView() {
  return (
    <div className="text-center">
      <p className="text-4xl mb-4" aria-hidden="true">
        🔗
      </p>
      <h1 className="text-h2 text-foreground mb-3">Enlace expirado</h1>
      <p className="text-body text-foreground-secondary mb-8">
        Este enlace de reserva ha expirado o no es válido.
        <br />
        Contacta con el estudio para que te envíen uno nuevo.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}

function AlreadyUsedView() {
  return (
    <div className="text-center">
      <p className="text-4xl mb-4" aria-hidden="true">
        ✅
      </p>
      <h1 className="text-h2 text-foreground mb-3">Enlace ya utilizado</h1>
      <p className="text-body text-foreground-secondary mb-8">
        Este enlace de reserva ya ha sido utilizado. Cada enlace solo puede usarse una vez.
        <br />
        Si necesitas ayuda, contacta con el estudio.
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

export default async function SessionLinkPage({ params }: Props) {
  const { token } = await params
  const result = await fetchSessionLink(token)

  return (
    <section className="max-w-xl mx-auto px-6 py-16 md:py-24">
      {!result.ok && result.reason === "expired" && <ExpiredSessionView />}
      {!result.ok && result.reason === "used" && <AlreadyUsedView />}
      {result.ok && <SessionBooking token={token} data={result.data} />}
    </section>
  )
}
