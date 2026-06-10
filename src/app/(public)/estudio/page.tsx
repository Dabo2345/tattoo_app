import type { Metadata } from "next"
import Link from "next/link"
import { MapPin, Phone, Mail, Clock, ShieldCheck, ArrowRight, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { studioInfo } from "@/modules/content/data/studio-info"

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `${studioInfo.name} — Estudio`,
  description: studioInfo.tagline,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EstudioPage() {
  const {
    name,
    tagline,
    description,
    address,
    city,
    phone,
    email,
    workingHours,
    parkingInfo,
    accessibilityInfo,
    hygieneInfo,
  } = studioInfo

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
          <p className="text-body-lg text-foreground-secondary mb-8">{tagline}</p>
          <p className="text-body text-foreground-secondary">{description}</p>
        </div>
      </section>

      {/* ── Info práctica ──────────────────────────────────────────────── */}
      <section aria-labelledby="info-heading" className="bg-background-secondary px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 id="info-heading" className="text-h2 text-foreground mb-10 text-center">
            Información práctica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contacto */}
            <div className="p-6 rounded-lg bg-surface border border-border">
              <h3 className="text-h4 text-foreground mb-4">Contacto y ubicación</h3>
              <dl className="flex flex-col gap-3">
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
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="sr-only">Teléfono</dt>
                    <dd className="text-sm text-foreground-secondary">{phone}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="sr-only">Email</dt>
                    <dd className="text-sm text-foreground-secondary">{email}</dd>
                  </div>
                </div>
                {parkingInfo && (
                  <div className="flex items-start gap-3">
                    <Car className="h-4 w-4 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <dt className="sr-only">Parking</dt>
                      <dd className="text-sm text-foreground-secondary">{parkingInfo}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Horarios */}
            <div className="p-6 rounded-lg bg-surface border border-border">
              <h3 className="text-h4 text-foreground mb-4">
                <Clock className="inline h-4 w-4 text-accent mr-2" aria-hidden="true" />
                Horario
              </h3>
              <dl className="flex flex-col gap-2">
                {workingHours.map(({ day, hours }) => (
                  <div key={day} className="flex justify-between items-center gap-4">
                    <dt className="text-sm text-foreground-secondary">{day}</dt>
                    <dd
                      className={`text-sm font-medium ${hours === "Cerrado" ? "text-foreground-muted" : "text-foreground"}`}
                    >
                      {hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Higiene */}
          <div className="mt-8 p-6 rounded-lg bg-surface border border-border">
            <h3 className="text-h4 text-foreground mb-3">
              <ShieldCheck className="inline h-4 w-4 text-accent mr-2" aria-hidden="true" />
              Higiene y seguridad
            </h3>
            <p className="text-sm text-foreground-secondary">{hygieneInfo}</p>
            {accessibilityInfo && (
              <p className="text-sm text-foreground-muted mt-2">{accessibilityInfo}</p>
            )}
          </div>
        </div>
      </section>

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
