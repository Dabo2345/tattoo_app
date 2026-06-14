import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    artistProfile: {
      upsert: vi.fn(),
    },
    studioInfo: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { updateArtistProfileAction, updateStudioInfoAction } from "@/app/admin/content/actions"

const ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"
const STUDIO_INFO_ID = "00000000-0000-0000-0000-000000000002"

const mockGetSession = vi.mocked(auth.api.getSession)
const mockArtistUpsert = vi.mocked(prisma.artistProfile.upsert)
const mockStudioUpsert = vi.mocked(prisma.studioInfo.upsert)
const mockAuditCreate = vi.mocked(prisma.auditLog.create)

const adminSession = { user: { id: "admin-1", email: "admin@example.com" } }

const validArtistInput = {
  name: "Carla Ink",
  bio: "Artista con más de 10 años de experiencia en tatuaje realista y blackwork.",
  specialties: ["Realismo", "Blackwork"],
  instagramHandle: "@carlaink",
  yearsOfExperience: 10,
}

const validStudioInput = {
  name: "Ink Studio Madrid",
  description: "Estudio de tatuajes premium en el centro de Madrid.",
  address: "Calle Gran Vía, 28",
  city: "Madrid",
  phone: "+34912345678",
  email: "hola@inkstudio.com",
  instagramHandle: "@inkstudiomadrid",
  googleMapsUrl: "https://maps.google.com/?q=Madrid",
}

// ─── updateArtistProfileAction ────────────────────────────────────────────────

describe("updateArtistProfileAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockArtistUpsert.mockResolvedValue({} as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await updateArtistProfileAction(validArtistInput)
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si el nombre está vacío", async () => {
    const result = await updateArtistProfileAction({ ...validArtistInput, name: "" })
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it("retorna error si la bio está vacía", async () => {
    const result = await updateArtistProfileAction({ ...validArtistInput, bio: "" })
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it("retorna error si specialties está vacío", async () => {
    const result = await updateArtistProfileAction({ ...validArtistInput, specialties: [] })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/especialidad/i)
  })

  it("retorna success con datos válidos", async () => {
    const result = await updateArtistProfileAction(validArtistInput)
    expect(result.success).toBe(true)
  })

  it("llama a upsert con el ARTIST_PROFILE_ID correcto", async () => {
    await updateArtistProfileAction(validArtistInput)
    expect(mockArtistUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ARTIST_PROFILE_ID },
      })
    )
  })

  it("normaliza instagramHandle quitando el @ inicial", async () => {
    await updateArtistProfileAction({ ...validArtistInput, instagramHandle: "@carlaink" })
    expect(mockArtistUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ instagramHandle: "carlaink" }),
      })
    )
  })

  it("no modifica instagramHandle si ya viene sin @", async () => {
    await updateArtistProfileAction({ ...validArtistInput, instagramHandle: "carlaink" })
    expect(mockArtistUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ instagramHandle: "carlaink" }),
      })
    )
  })

  it("crea AuditLog con acción ARTIST_PROFILE_UPDATED", async () => {
    await updateArtistProfileAction(validArtistInput)
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "ARTIST_PROFILE_UPDATED",
          entityId: ARTIST_PROFILE_ID,
          adminUserId: "admin-1",
        }),
      })
    )
  })
})

// ─── updateStudioInfoAction ───────────────────────────────────────────────────

describe("updateStudioInfoAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockStudioUpsert.mockResolvedValue({} as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await updateStudioInfoAction(validStudioInput)
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si el email es inválido", async () => {
    const result = await updateStudioInfoAction({ ...validStudioInput, email: "no-es-email" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/email/i)
  })

  it("retorna error si googleMapsUrl es una URL inválida", async () => {
    const result = await updateStudioInfoAction({
      ...validStudioInput,
      googleMapsUrl: "no-es-url",
    })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/url/i)
  })

  it("retorna error si el nombre está vacío", async () => {
    const result = await updateStudioInfoAction({ ...validStudioInput, name: "" })
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it("retorna success con datos válidos", async () => {
    const result = await updateStudioInfoAction(validStudioInput)
    expect(result.success).toBe(true)
  })

  it("llama a upsert con el STUDIO_INFO_ID correcto", async () => {
    await updateStudioInfoAction(validStudioInput)
    expect(mockStudioUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: STUDIO_INFO_ID },
      })
    )
  })

  it("normaliza instagramHandle quitando el @ inicial", async () => {
    await updateStudioInfoAction({ ...validStudioInput, instagramHandle: "@inkstudio" })
    expect(mockStudioUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ instagramHandle: "inkstudio" }),
      })
    )
  })

  it("acepta googleMapsUrl vacío como campo opcional", async () => {
    const result = await updateStudioInfoAction({ ...validStudioInput, googleMapsUrl: undefined })
    expect(result.success).toBe(true)
  })

  it("crea AuditLog con acción STUDIO_INFO_UPDATED", async () => {
    await updateStudioInfoAction(validStudioInput)
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "STUDIO_INFO_UPDATED",
          entityId: STUDIO_INFO_ID,
          adminUserId: "admin-1",
        }),
      })
    )
  })
})
