import { prisma } from "@/lib/db/prisma"
import type {
  GalleryImageData,
  StyleTagData,
  AdminGalleryImageData,
  AdminStyleTagData,
  CreateGalleryImageInput,
} from "../types"

export const galleryRepository = {
  // ─── Public reads ──────────────────────────────────────────────────────────

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

  // ─── Admin reads ───────────────────────────────────────────────────────────

  async findAllForAdmin(): Promise<AdminGalleryImageData[]> {
    return prisma.galleryImage.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, url: true, thumbnailUrl: true, altText: true, order: true },
    })
  },

  async findAllTagsForAdmin(): Promise<AdminStyleTagData[]> {
    return prisma.styleTag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
  },

  async findById(id: string): Promise<(AdminGalleryImageData & { url: string }) | null> {
    return prisma.galleryImage.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, url: true, thumbnailUrl: true, altText: true, order: true },
    })
  },

  // ─── Writes ────────────────────────────────────────────────────────────────

  async getMaxOrder(): Promise<number> {
    const result = await prisma.galleryImage.aggregate({
      _max: { order: true },
      where: { deletedAt: null },
    })
    return (result._max.order ?? -1) + 1
  },

  async create(input: CreateGalleryImageInput): Promise<AdminGalleryImageData> {
    return prisma.galleryImage.create({
      data: {
        url: input.url,
        thumbnailUrl: input.thumbnailUrl,
        altText: input.altText,
        order: input.order,
        styleTags:
          input.styleTagIds.length > 0
            ? { connect: input.styleTagIds.map((id) => ({ id })) }
            : undefined,
      },
      select: { id: true, url: true, thumbnailUrl: true, altText: true, order: true },
    })
  },

  async softDelete(id: string): Promise<void> {
    await prisma.galleryImage.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },

  async updateOrders(updates: Array<{ id: string; order: number }>): Promise<void> {
    await prisma.$transaction(
      updates.map(({ id, order }) =>
        prisma.galleryImage.updateMany({
          where: { id, deletedAt: null },
          data: { order },
        })
      )
    )
  },
}
