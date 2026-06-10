import type { Metadata } from "next"
import Link from "next/link"
import { MapPin, AtSign, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { artistProfile } from "@/modules/content/data/artist-profile"

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `${artistProfile.name} — Artista`,
  description: artistProfile.tagline,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const { name, tagline, bio, specialties, experience, photoUrl, instagram, location } =
    artistProfile

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="artist-name-heading" className="bg-background px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-start">
          {/* Photo placeholder */}
          <div
            className="w-full md:w-64 shrink-0 aspect-square rounded-lg bg-surface border border-border"
            aria-hidden="true"
            role="img"
            aria-label={photoUrl ? `Foto de ${name}` : "Foto del artista — próximamente"}
          />

          {/* Info */}
          <div className="flex-1">
            <h1 id="artist-name-heading" className="text-h1 text-foreground mb-2">
              {name}
            </h1>
            <p className="text-body-lg text-foreground-secondary mb-6">{tagline}</p>

            <dl className="flex flex-col gap-2 mb-8">
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <Clock className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                <dt className="sr-only">Experiencia</dt>
                <dd>{experience} de experiencia</dd>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <MapPin className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                <dt className="sr-only">Ubicación</dt>
                <dd>{location}</dd>
              </div>
              {instagram && (
                <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <AtSign className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                  <dt className="sr-only">Instagram</dt>
                  <dd>{instagram}</dd>
                </div>
              )}
            </dl>

            <Button asChild size="lg">
              <Link href="/reservar">
                Reservar consulta
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Bio ────────────────────────────────────────────────────────── */}
      <section aria-labelledby="bio-heading" className="bg-background-secondary px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 id="bio-heading" className="text-h2 text-foreground mb-6">
            Sobre mí
          </h2>
          <p className="text-body-lg text-foreground-secondary leading-relaxed">{bio}</p>
        </div>
      </section>

      {/* ── Especialidades ─────────────────────────────────────────────── */}
      <section aria-labelledby="specialties-heading" className="bg-background px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 id="specialties-heading" className="text-h2 text-foreground mb-8">
            Especialidades
          </h2>
          <ul className="flex flex-wrap gap-3" aria-label="Estilos de tatuaje">
            {specialties.map((specialty) => (
              <li
                key={specialty}
                className="px-5 py-2 rounded-full border border-border text-foreground-secondary
                  text-sm font-medium bg-surface"
              >
                {specialty}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="cta-perfil-heading"
        className="bg-background-secondary px-6 py-16 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <h2 id="cta-perfil-heading" className="text-h2 text-foreground mb-4">
            ¿Quieres trabajar conmigo?
          </h2>
          <p className="text-body text-foreground-secondary mb-8">
            El primer paso es una consulta gratuita donde hablamos de tu idea.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/reservar">
                Reservar consulta
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/galeria">Ver galería</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
