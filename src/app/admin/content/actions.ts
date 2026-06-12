"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// ─── Singleton IDs ────────────────────────────────────────────────────────────

const ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"
const STUDIO_INFO_ID = "00000000-0000-0000-0000-000000000002"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const artistProfileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  bio: z.string().min(1, "La bio es requerida").max(2000),
  specialties: z.array(z.string().min(1).max(50)).min(1, "Añade al menos una especialidad").max(10),
  instagramHandle: z.string().max(50).optional(),
  yearsOfExperience: z.number({ error: "Debe ser un número" }).int().min(0).max(60).optional(),
})

const studioInfoSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().min(1, "La descripción es requerida").max(2000),
  address: z.string().min(1, "La dirección es requerida").max(200),
  city: z.string().min(1, "La ciudad es requerida").max(100),
  phone: z.string().min(1, "El teléfono es requerido").max(20),
  email: z.string().email("Email inválido").max(100),
  instagramHandle: z.string().max(50).optional(),
  googleMapsUrl: z.string().url("URL inválida").optional(),
})

export type ArtistProfileInput = z.infer<typeof artistProfileSchema>
export type StudioInfoInput = z.infer<typeof studioInfoSchema>

// ─── getAdminSession ──────────────────────────────────────────────────────────

async function getAdminSession() {
  return auth.api.getSession({ headers: await headers() })
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeInstagramHandle(handle: string | undefined): string | undefined {
  if (!handle) return undefined
  return handle.startsWith("@") ? handle.slice(1) : handle
}

// ─── updateArtistProfileAction ────────────────────────────────────────────────

export async function updateArtistProfileAction(input: ArtistProfileInput): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, error: "No autorizado" }
  }

  const parsed = artistProfileSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return { success: false, error: message }
  }

  const data = {
    ...parsed.data,
    instagramHandle: normalizeInstagramHandle(parsed.data.instagramHandle),
  }

  await prisma.artistProfile.upsert({
    where: { id: ARTIST_PROFILE_ID },
    update: data,
    create: { id: ARTIST_PROFILE_ID, ...data },
  })

  await prisma.auditLog.create({
    data: {
      action: "ARTIST_PROFILE_UPDATED",
      entityId: ARTIST_PROFILE_ID,
      entityType: "ArtistProfile",
      adminUserId: session.user.id,
      metadata: { name: data.name },
    },
  })

  return { success: true }
}

// ─── updateStudioInfoAction ───────────────────────────────────────────────────

export async function updateStudioInfoAction(input: StudioInfoInput): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, error: "No autorizado" }
  }

  const parsed = studioInfoSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return { success: false, error: message }
  }

  const data = {
    ...parsed.data,
    instagramHandle: normalizeInstagramHandle(parsed.data.instagramHandle),
  }

  await prisma.studioInfo.upsert({
    where: { id: STUDIO_INFO_ID },
    update: data,
    create: { id: STUDIO_INFO_ID, ...data },
  })

  await prisma.auditLog.create({
    data: {
      action: "STUDIO_INFO_UPDATED",
      entityId: STUDIO_INFO_ID,
      entityType: "StudioInfo",
      adminUserId: session.user.id,
      metadata: { name: data.name },
    },
  })

  return { success: true }
}
