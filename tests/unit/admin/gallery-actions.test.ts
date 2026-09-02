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

vi.mock("@/modules/gallery/services/gallery-service", () => ({
  galleryService: {
    upload: vi.fn(),
    softDelete: vi.fn(),
    reorder: vi.fn(),
  },
}))

import { auth } from "@/lib/auth"
import { galleryService } from "@/modules/gallery/services/gallery-service"
import {
  uploadGalleryImageAction,
  deleteGalleryImageAction,
  reorderGalleryAction,
} from "@/app/admin/gallery/actions"

const mockGetSession = vi.mocked(auth.api.getSession)
const mockUpload = vi.mocked(galleryService.upload)
const mockSoftDelete = vi.mocked(galleryService.softDelete)
const mockReorder = vi.mocked(galleryService.reorder)

const adminSession = { user: { id: "admin-1", email: "admin@example.com" } }

const createdImage = {
  id: "img-1",
  url: "https://example.com/gallery/test-uuid-1234.jpg",
  thumbnailUrl: "https://example.com/gallery/test-uuid-1234.jpg",
  altText: null,
  order: 0,
}

function makeFormData(mimeType = "image/jpeg", size = 1024 * 1024): FormData {
  const file = new File(["x".repeat(size)], "test.jpg", { type: mimeType })
  const fd = new FormData()
  fd.append("file", file)
  return fd
}

// ─── uploadGalleryImageAction ─────────────────────────────────────────────────

describe("uploadGalleryImageAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockUpload.mockResolvedValue(createdImage)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await uploadGalleryImageAction(makeFormData())
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si no se proporcionó archivo", async () => {
    const fd = new FormData()
    const result = await uploadGalleryImageAction(fd)
    expect(result.success).toBe(false)
    expect(result.error).toBe("No se proporcionó ningún archivo")
  })

  it("retorna error si el service lanza (archivo inválido)", async () => {
    mockUpload.mockRejectedValueOnce(
      new Error("Formato no permitido. Solo se aceptan JPEG y WebP.")
    )
    const result = await uploadGalleryImageAction(makeFormData("image/png"))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Formato no permitido/)
  })

  it("retorna success con id y url cuando todo es correcto", async () => {
    const result = await uploadGalleryImageAction(makeFormData())
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe("img-1")
    expect(result.data?.url).toBe("https://example.com/gallery/test-uuid-1234.jpg")
  })

  it("llama a galleryService.upload con adminUserId de la sesión", async () => {
    await uploadGalleryImageAction(makeFormData())
    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.objectContaining({ adminUserId: "admin-1" })
    )
  })
})

// ─── deleteGalleryImageAction ─────────────────────────────────────────────────

describe("deleteGalleryImageAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockSoftDelete.mockResolvedValue(undefined)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await deleteGalleryImageAction("img-1")
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si el service lanza (imagen no encontrada)", async () => {
    mockSoftDelete.mockRejectedValueOnce(new Error("Imagen no encontrada"))
    const result = await deleteGalleryImageAction("nonexistent")
    expect(result.success).toBe(false)
    expect(result.error).toBe("Imagen no encontrada")
  })

  it("retorna success y llama al service con id y adminUserId", async () => {
    const result = await deleteGalleryImageAction("img-1")
    expect(result.success).toBe(true)
    expect(mockSoftDelete).toHaveBeenCalledWith("img-1", "admin-1")
  })
})

// ─── reorderGalleryAction ─────────────────────────────────────────────────────

describe("reorderGalleryAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockReorder.mockResolvedValue(undefined)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await reorderGalleryAction(["img-1", "img-2"])
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna success y delega al service", async () => {
    const result = await reorderGalleryAction(["img-2", "img-1"])
    expect(result.success).toBe(true)
    expect(mockReorder).toHaveBeenCalledWith(["img-2", "img-1"])
  })

  it("retorna success con array vacío", async () => {
    const result = await reorderGalleryAction([])
    expect(result.success).toBe(true)
    expect(mockReorder).toHaveBeenCalledWith([])
  })
})
