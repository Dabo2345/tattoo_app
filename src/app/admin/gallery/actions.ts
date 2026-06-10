"use server"

import { randomUUID } from "crypto"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { validateImageFile, uploadImage, getPublicUrl } from "@/lib/supabase/storage"

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

  const validation = validateImageFile(file.type, file.size)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const uuid = randomUUID()
  const fileBuffer = await file.arrayBuffer()

  const { path } = await uploadImage(fileBuffer, validation.mimeType, uuid, validation.extension)
  const url = getPublicUrl(path)

  const maxOrderResult = await prisma.galleryImage.aggregate({
    _max: { order: true },
    where: { deletedAt: null },
  })
  const nextOrder = (maxOrderResult._max.order ?? -1) + 1

  const image = await prisma.galleryImage.create({
    data: {
      url,
      thumbnailUrl: url, // same URL until thumbnails are generated (#future)
      altText: altText ?? null,
      order: nextOrder,
      styleTags:
        styleTagIds.length > 0 ? { connect: styleTagIds.map((id) => ({ id })) } : undefined,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: "GALLERY_IMAGE_UPLOADED",
      entityId: image.id,
      entityType: "GalleryImage",
      adminUserId: session.user.id,
      metadata: { url, order: nextOrder, styleTagIds },
    },
  })

  return { success: true, data: { id: image.id, url } }
}

// ─── deleteGalleryImageAction ─────────────────────────────────────────────────

export async function deleteGalleryImageAction(id: string): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, error: "No autorizado" }
  }

  const image = await prisma.galleryImage.findFirst({
    where: { id, deletedAt: null },
  })

  if (!image) {
    return { success: false, error: "Imagen no encontrada" }
  }

  await prisma.galleryImage.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      action: "GALLERY_IMAGE_DELETED",
      entityId: id,
      entityType: "GalleryImage",
      adminUserId: session.user.id,
      metadata: { url: image.url },
    },
  })

  return { success: true }
}

// ─── reorderGalleryAction ─────────────────────────────────────────────────────

export async function reorderGalleryAction(orderedIds: string[]): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, error: "No autorizado" }
  }

  if (orderedIds.length === 0) {
    return { success: true }
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.galleryImage.updateMany({
        where: { id, deletedAt: null },
        data: { order: index },
      })
    )
  )

  return { success: true }
}
