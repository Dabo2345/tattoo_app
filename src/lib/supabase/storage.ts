import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

// ─── Constants ────────────────────────────────────────────────────────────────

const GALLERY_BUCKET = "gallery"
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/webp"] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

const EXTENSION_MAP: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

// ─── Client ───────────────────────────────────────────────────────────────────

function getStorageClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY).storage
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: true
  mimeType: AllowedMimeType
  extension: string
}

export interface ValidationError {
  valid: false
  error: string
}

export function validateImageFile(
  mimeType: string,
  sizeBytes: number
): ValidationResult | ValidationError {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return { valid: false, error: "Formato no permitido. Solo se aceptan JPEG y WebP." }
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "El archivo supera el límite de 10MB." }
  }
  return {
    valid: true,
    mimeType: mimeType as AllowedMimeType,
    extension: EXTENSION_MAP[mimeType as AllowedMimeType],
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function uploadImage(
  fileBuffer: ArrayBuffer,
  mimeType: AllowedMimeType,
  uuid: string,
  extension: string
): Promise<{ path: string }> {
  const storage = getStorageClient()
  const path = `gallery/${uuid}.${extension}`

  const { error } = await storage.from(GALLERY_BUCKET).upload(path, fileBuffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`)
  }

  return { path }
}

export function getPublicUrl(path: string): string {
  const storage = getStorageClient()
  const { data } = storage.from(GALLERY_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteImage(path: string): Promise<void> {
  const storage = getStorageClient()
  const { error } = await storage.from(GALLERY_BUCKET).remove([path])
  if (error) {
    throw new Error(`Error al eliminar imagen: ${error.message}`)
  }
}
