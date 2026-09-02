import { randomUUID } from "crypto"
import { validateImageFile, uploadImage, getPublicUrl } from "@/lib/supabase/storage"
import { auditService } from "@/modules/audit/services/audit-service"
import { galleryRepository } from "../repositories/gallery-repository"
import type { AdminGalleryImageData } from "../types"

export const galleryService = {
  /**
   * Valida, sube a Supabase y registra una nueva imagen en la galería.
   * RB-012: solo JPEG y WebP, máx 10MB.
   */
  async upload(
    file: Blob,
    options: { altText?: string; styleTagIds: string[]; adminUserId: string }
  ): Promise<AdminGalleryImageData> {
    const validation = validateImageFile(file.type, file.size)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const uuid = randomUUID()
    const fileBuffer = await file.arrayBuffer()
    const { path } = await uploadImage(fileBuffer, validation.mimeType, uuid, validation.extension)
    const url = getPublicUrl(path)

    const order = await galleryRepository.getMaxOrder()

    const image = await galleryRepository.create({
      url,
      thumbnailUrl: url,
      altText: options.altText ?? null,
      order,
      styleTagIds: options.styleTagIds,
    })

    await auditService.log("GALLERY_IMAGE_UPLOADED", image.id, {
      entityType: "GalleryImage",
      adminUserId: options.adminUserId,
      metadata: { url, order, styleTagIds: options.styleTagIds },
    })

    return image
  },

  /**
   * Soft-delete de una imagen de galería.
   * Lanza error si la imagen no existe o ya fue eliminada.
   */
  async softDelete(id: string, adminUserId: string): Promise<void> {
    const image = await galleryRepository.findById(id)
    if (!image) {
      throw new Error("Imagen no encontrada")
    }

    await galleryRepository.softDelete(id)

    await auditService.log("GALLERY_IMAGE_DELETED", id, {
      entityType: "GalleryImage",
      adminUserId,
      metadata: { url: image.url },
    })
  },

  /**
   * Actualiza el orden de las imágenes según el array de IDs recibido.
   * Si el array está vacío, es un no-op.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return

    await galleryRepository.updateOrders(orderedIds.map((id, index) => ({ id, order: index })))
  },
}
