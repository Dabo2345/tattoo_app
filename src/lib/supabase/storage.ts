import { supabaseAdmin } from "./client"
import { logger } from "@/lib/logger"
import { InternalError } from "@/lib/api/errors"

const GALLERY_BUCKET = "gallery"
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/webp"] as const

type AllowedMimeType = (typeof ALLOWED_TYPES)[number]

// ─── Validación ───────────────────────────────────────────────────────────────

export function validateImageFile(file: File): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "La imagen no puede superar los 10MB" }
  }
  if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return { valid: false, error: "Solo se permiten imágenes JPEG o WebP" }
  }
  return { valid: true }
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  originalUrl: string
  thumbnailUrl: string
  storagePath: string
  thumbPath: string
}

export async function uploadGalleryImage(file: File, imageId: string): Promise<UploadResult> {
  const ext = file.type === "image/webp" ? "webp" : "jpg"
  const originalPath = `gallery/original/${imageId}.${ext}`
  const thumbPath = `gallery/thumbs/${imageId}.${ext}`

  // Upload original
  const { error: uploadError } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .upload(originalPath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    logger.error({ error: uploadError, imageId }, "Failed to upload image to Supabase Storage")
    throw new InternalError("Error al subir la imagen")
  }

  // Thumbnail — MVP: misma imagen redimensionada en futuro (#043 con sharp)
  const thumbBuffer = await file.arrayBuffer()
  const { error: thumbError } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .upload(thumbPath, thumbBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (thumbError) {
    // Rollback del original si falla el thumb
    await supabaseAdmin.storage.from(GALLERY_BUCKET).remove([originalPath])
    logger.error({ error: thumbError, imageId }, "Failed to upload thumbnail, rolled back original")
    throw new InternalError("Error al generar el thumbnail")
  }

  const { data: originalUrlData } = supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(originalPath)

  const { data: thumbUrlData } = supabaseAdmin.storage.from(GALLERY_BUCKET).getPublicUrl(thumbPath)

  return {
    originalUrl: originalUrlData.publicUrl,
    thumbnailUrl: thumbUrlData.publicUrl,
    storagePath: originalPath,
    thumbPath,
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteGalleryImages(storagePath: string, thumbPath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .remove([storagePath, thumbPath])

  if (error) {
    logger.error({ error, storagePath }, "Failed to delete images from Supabase Storage")
    // No lanzar excepción — el soft delete en DB ya ocurrió.
    // El archivo en Storage puede limpiarse manualmente si falla.
  }
}

// ─── URL pública ──────────────────────────────────────────────────────────────

export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from(GALLERY_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
