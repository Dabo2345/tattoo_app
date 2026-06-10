import { prisma } from "@/lib/db/prisma"
import type { GalleryImageData, StyleTagData } from "../types"

export const galleryRepository = {
  async findAll(tagSlug?: string): Promise<GalleryImageData[]> {
    return prisma.galleryImage.findMany({
      where: {
        deletedAt: null,
        ...(tagSlug ? { styleTags: { some: { slug: tagSlug } } } : {}),
      },
      include: { styleTags: true },
      orderBy: { order: "asc" },
    })
  },

  async findAllTags(): Promise<StyleTagData[]> {
    return prisma.styleTag.findMany({
      orderBy: { name: "asc" },
    })
  },
}
