import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MessageSquare, Pencil, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Tattoo Studio — Arte que dura toda la vida",
  description:
    "Estudio de tatuajes profesional. Diseños únicos y personalizados realizados con precisión y pasión. Reserva tu consulta hoy.",
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"

const HOW_IT_WORKS = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Consulta inicial",
    description:
      "Conversamos sobre tu idea, el estilo que buscas y resolvemos todas tus dudas antes de empezar.",
  },
  {
    icon: Pencil,
    step: "02",
    title: "Diseño personalizado",
    description:
      "Creamos un diseño exclusivo adaptado a tu visión y a tu cuerpo. Sin plantillas, sin repeticiones.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Tu tatuaje definitivo",
    description:
      "El día de la sesión, con los más altos estándares de higiene y calidad, hacemos realidad tu tatuaje.",
  },
]

const ASPECT_CLASSES = ["aspect-[3/4]", "aspect-square", "aspect-[4/3]"]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [featuredImages, profile] = await Promise.all([
    prisma.galleryImage.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      take: 6,
    }),
    prisma.artistProfile.findUnique({ where: { id: ARTIST_PROFILE_ID } }),
  ])

  const artistName = profile?.name ?? null
  const artistBio = profile?.bio ? profile.bio.slice(0, 300) : null
  const artistSpecialties = profile?.specialties ?? []

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 bg-background"
      >
        <p className="text-accent text-sm font-medium uppercase tracking-widest mb-4">
          Estudio profesional de tatuajes
        </p>
        <h1
          id="hero-heading"
          className="text-h1 md:text-display text-foreground max-w-2xl mx-auto mb-6"
        >
          Arte que dura toda la vida
        </h1>
        <p className="text-body-lg text-foreground-secondary max-w-xl mx-auto mb-10">
          Diseños únicos y personalizados. Cada pieza es creada exclusivamente para ti, con
          precisión artística y los más altos estándares de higiene.
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
      </section>

      {/* ── Cómo funciona ──────────────────────────────────────────────── */}
      <section
        aria-labelledby="how-heading"
        className="bg-background-secondary px-6 py-20 md:py-28"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 id="how-heading" className="text-h2 text-foreground mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-body text-foreground-secondary max-w-lg mx-auto">
              Un proceso simple y transparente diseñado para que tu experiencia sea memorable desde
              el primer contacto.
            </p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8" aria-label="Pasos del proceso">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
              <li
                key={step}
                className="flex flex-col items-start p-6 rounded-lg bg-surface border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-caption font-semibold text-accent tabular-nums">
                    {step}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                  <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <h3 className="text-h4 text-foreground mb-2">{title}</h3>
                <p className="text-sm text-foreground-secondary">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Trabajos destacados ────────────────────────────────────────── */}
      <section aria-labelledby="gallery-heading" className="bg-background px-6 py-20 md:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <h2 id="gallery-heading" className="text-h2 text-foreground mb-2">
                Trabajos destacados
              </h2>
              <p className="text-body text-foreground-secondary">
                Una muestra de lo que somos capaces de crear.
              </p>
            </div>
            <Link
              href="/galeria"
              className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover
                transition-colors font-medium shrink-0"
            >
              Ver galería completa
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ul
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            aria-label="Galería de trabajos destacados"
          >
            {featuredImages.length > 0
              ? featuredImages.map((image, i) => (
                  <li key={image.id}>
                    <Link
                      href="/galeria"
                      className={`block relative ${ASPECT_CLASSES[i % 3]} rounded-lg overflow-hidden
                        bg-surface border border-border hover:border-accent transition-colors`}
                      aria-label={image.altText ?? `Ver trabajo en la galería`}
                    >
                      <Image
                        src={image.url}
                        alt={image.altText ?? "Trabajo de tatuaje"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </Link>
                  </li>
                ))
              : Array.from({ length: 6 }, (_, i) => (
                  <li key={i}>
                    <Link
                      href="/galeria"
                      className={`block ${ASPECT_CLASSES[i % 3]} rounded-lg bg-surface border border-border
                        hover:border-accent transition-colors`}
                      aria-label={`Ver trabajo ${i + 1} en la galería`}
                    />
                  </li>
                ))}
          </ul>
        </div>
      </section>

      {/* ── Artista ────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="artist-heading"
        className="bg-background-secondary px-6 py-20 md:py-28"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="artist-heading" className="text-h2 text-foreground mb-4">
            {artistName ? `${artistName}` : "El artista detrás del estudio"}
          </h2>
          {artistBio ? (
            <p className="text-body-lg text-foreground-secondary mb-10">{artistBio}</p>
          ) : (
            <>
              <p className="text-body-lg text-foreground-secondary mb-4">
                Con más de una década de experiencia en tatuajes, combino técnica depurada con una
                sensibilidad artística única para crear piezas que trascienden lo efímero.
              </p>
              <p className="text-body text-foreground-secondary mb-10">
                Especializado en blackwork, realismo y geometric, cada diseño es el resultado de una
                conversación profunda con el cliente y un compromiso total con la excelencia.
              </p>
            </>
          )}
          {artistSpecialties.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-2 mb-10" aria-label="Especialidades">
              {artistSpecialties.map((s) => (
                <li
                  key={s}
                  className="px-3 py-1 rounded-full border border-border text-foreground-secondary
                    text-xs font-medium bg-surface"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline">
            <Link href="/perfil">Conocer al artista</Link>
          </Button>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────────── */}
      <section
        aria-labelledby="cta-heading"
        className="bg-background px-6 py-20 md:py-28 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <h2 id="cta-heading" className="text-h2 text-foreground mb-4">
            ¿Listo para tu tatuaje?
          </h2>
          <p className="text-body text-foreground-secondary mb-10">
            El primer paso es una consulta gratuita. Cuéntanos tu idea y comenzamos a trabajar
            juntos para hacerla realidad.
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
