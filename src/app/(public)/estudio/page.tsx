import type { Metadata } from "next"
import Link from "next/link"
import { MapPin, Phone, Mail, ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

const STUDIO_INFO_ID = "00000000-0000-0000-0000-000000000002"

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const studio = await prisma.studioInfo.findUnique({
    where: { id: STUDIO_INFO_ID },
  })

  const name = studio?.name ?? "Estudio"

  return {
    title: `${name} — Estudio`,
    description: studio?.description?.slice(0, 160) ?? "Estudio de tatuajes profesional",
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EstudioPage() {
  const studio = await prisma.studioInfo.findUnique({
    where: { id: STUDIO_INFO_ID },
  })

  const name = studio?.name ?? "Estudio"
  const description = studio?.description ?? null
  const address = studio?.address ?? null
  const city = studio?.city ?? null
  const phone = studio?.phone ?? null
  const email = studio?.email ?? null

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="studio-heading"
        className="bg-background px-6 py-16 md:py-24 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <h1 id="studio-heading" className="text-h1 text-foreground mb-4">
            {name}
          </h1>
          {description && <p className="text-body text-foreground-secondary">{description}</p>}
        </div>
      </section>

      {/* ── Info práctica ──────────────────────────────────────────────── */}
      {(address || phone || email) && (
        <section aria-labelledby="info-heading" className="bg-background-secondary px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 id="info-heading" className="text-h2 text-foreground mb-10 text-center">
              Información práctica
            </h2>

            <div className="p-6 rounded-lg bg-surface border border-border max-w-md mx-auto">
              <h3 className="text-h4 text-foreground mb-4">Contacto y ubicación</h3>
              <dl className="flex flex-col gap-3">
                {address && city && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <dt className="sr-only">Dirección</dt>
                      <dd className="text-sm text-foreground-secondary">
                        {address}
                        <br />
                        {city}
                      </dd>
                    </div>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                    <div>
                      <dt className="sr-only">Teléfono</dt>
                      <dd className="text-sm text-foreground-secondary">{phone}</dd>
                    </div>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                    <div>
                      <dt className="sr-only">Email</dt>
                      <dd className="text-sm text-foreground-secondary">{email}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-8 p-6 rounded-lg bg-surface border border-border">
              <h3 className="text-h4 text-foreground mb-3">
                <ShieldCheck className="inline h-4 w-4 text-accent mr-2" aria-hidden="true" />
                Higiene y seguridad
              </h3>
              <p className="text-sm text-foreground-secondary">
                Trabajamos con material de un solo uso, esterilización en autoclave y superficies
                desinfectadas entre cada cliente. Cumplimos con toda la normativa sanitaria vigente.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="cta-estudio-heading"
        className="bg-background px-6 py-16 text-center"
      >
        <div className="max-w-xl mx-auto">
          <h2 id="cta-estudio-heading" className="text-h2 text-foreground mb-4">
            ¿Listo para visitarnos?
          </h2>
          <p className="text-body text-foreground-secondary mb-8">
            Reserva tu consulta gratuita y te esperamos en el estudio.
          </p>
          <Button asChild size="lg">
            <Link href="/reservar">
              Reservar consulta
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
