import type { Metadata } from "next"
import { galleryRepository } from "@/modules/gallery/repositories/gallery-repository"
import { GalleryGrid } from "@/components/admin/gallery-grid"
import { GalleryUploadForm } from "@/components/admin/gallery-upload-form"

export const metadata: Metadata = {
  title: "Galería Admin",
  robots: { index: false, follow: false },
}

export default async function AdminGalleryPage() {
  const [images, styleTags] = await Promise.all([
    galleryRepository.findAllForAdmin(),
    galleryRepository.findAllTagsForAdmin(),
  ])

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h2 text-foreground">Galería</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Gestiona las imágenes del estudio.
          </p>
        </div>
        <GalleryUploadForm styleTags={styleTags} />
      </div>

      <GalleryGrid initialImages={images} />
    </div>
  )
}
