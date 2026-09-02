"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { galleryService } from "@/modules/gallery/services/gallery-service"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
}

// ─── getAdminSession ──────────────────────────────────────────────────────────

async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session
}

// ─── uploadGalleryImageAction ─────────────────────────────────────────────────

export async function uploadGalleryImageAction(
  formData: FormData
): Promise<ActionResult<{ id: string; url: string }>> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, error: "No autorizado" }
  }

  const file = formData.get("file")
  if (!file || !(file instanceof Blob)) {
    return { success: false, error: "No se proporcionó ningún archivo" }
  }

  const altText = (formData.get("altText") as string | null) ?? undefined
  const styleTagIds = formData.getAll("styleTagIds") as string[]

  try {
    const image = await galleryService.upload(file, {
      altText,
      styleTagIds,
      adminUserId: session.user.id,
    })
    revalidatePath("/")
    revalidatePath("/galeria")
    return { success: true, data: { id: image.id, url: image.url } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al subir imagen" }
  }
}

// ─── deleteGalleryImageAction ─────────────────────────────────────────────────

export async function deleteGalleryImageAction(id: string): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, error: "No autorizado" }
  }

  try {
    await galleryService.softDelete(id, session.user.id)
    revalidatePath("/")
    revalidatePath("/galeria")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al eliminar imagen",
    }
  }
}

// ─── reorderGalleryAction ─────────────────────────────────────────────────────

export async function reorderGalleryAction(orderedIds: string[]): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, error: "No autorizado" }
  }

  await galleryService.reorder(orderedIds)
  revalidatePath("/")
  revalidatePath("/galeria")
  return { success: true }
}
