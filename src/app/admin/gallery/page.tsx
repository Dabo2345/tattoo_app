import type { Metadata } from "next"
import { prisma } from "@/lib/db/prisma"
import { GalleryGrid } from "@/components/admin/gallery-grid"
import { GalleryUploadForm } from "@/components/admin/gallery-upload-form"

export const metadata: Metadata = {
  title: "Galería Admin",
  robots: { index: false, follow: false },
}

export default async function AdminGalleryPage() {
  const [images, styleTags] = await Promise.all([
    prisma.galleryImage.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, url: true, thumbnailUrl: true, altText: true, order: true },
    }),
    prisma.styleTag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
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
