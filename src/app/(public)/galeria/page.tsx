import type { Metadata } from "next"
import { galleryRepository } from "@/modules/gallery/repositories/gallery-repository"
import { GalleryGrid } from "@/modules/gallery/components/gallery-grid"

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Galería — Portfolio de tatuajes",
  description:
    "Portfolio de trabajos realizados en el estudio. Blackwork, realismo, geometric y más estilos.",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GaleriaPage() {
  const [images, tags] = await Promise.all([
    galleryRepository.findAll(),
    galleryRepository.findAllTags(),
  ])

  return (
    <section
      aria-labelledby="gallery-page-heading"
      className="max-w-6xl mx-auto px-6 py-12 md:py-16"
    >
      <div className="mb-10">
        <h1 id="gallery-page-heading" className="text-h1 text-foreground mb-2">
          Galería
        </h1>
        <p className="text-body text-foreground-secondary">
          Portfolio de trabajos realizados en el estudio.
        </p>
      </div>

      <GalleryGrid images={images} tags={tags} />
    </section>
  )
}
