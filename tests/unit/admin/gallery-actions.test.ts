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
    galleryImage: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      aggregate: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/supabase/storage", () => ({
  validateImageFile: vi.fn(),
  uploadImage: vi.fn(),
  getPublicUrl: vi.fn(),
}))

vi.mock("crypto", async (importOriginal) => {
  const original = await importOriginal<typeof import("crypto")>()
  return {
    ...original,
    randomUUID: vi.fn(() => "test-uuid-1234"),
  }
})

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import * as storage from "@/lib/supabase/storage"
import {
  uploadGalleryImageAction,
  deleteGalleryImageAction,
  reorderGalleryAction,
} from "@/app/admin/gallery/actions"

const mockGetSession = vi.mocked(auth.api.getSession)
const mockFindFirst = vi.mocked(prisma.galleryImage.findFirst)
const mockCreate = vi.mocked(prisma.galleryImage.create)
const mockUpdate = vi.mocked(prisma.galleryImage.update)
const mockAggregate = vi.mocked(prisma.galleryImage.aggregate)
const mockTransaction = vi.mocked(prisma.$transaction)
const mockAuditCreate = vi.mocked(prisma.auditLog.create)
const mockValidateImageFile = vi.mocked(storage.validateImageFile)
const mockUploadImage = vi.mocked(storage.uploadImage)
const mockGetPublicUrl = vi.mocked(storage.getPublicUrl)

const adminSession = { user: { id: "admin-1", email: "admin@example.com" } }

const createdImage = {
  id: "img-1",
  url: "https://example.com/gallery/test-uuid-1234.jpg",
  thumbnailUrl: "https://example.com/gallery/test-uuid-1234.jpg",
  altText: null,
  order: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  styleTags: [],
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
    mockValidateImageFile.mockReturnValue({
      valid: true,
      mimeType: "image/jpeg",
      extension: "jpg",
    })
    mockUploadImage.mockResolvedValue({ path: "gallery/test-uuid-1234.jpg" })
    mockGetPublicUrl.mockReturnValue("https://example.com/gallery/test-uuid-1234.jpg")
    mockAggregate.mockResolvedValue({ _max: { order: -1 } } as never)
    mockCreate.mockResolvedValue(createdImage as never)
    mockAuditCreate.mockResolvedValue({} as never)
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

  it("retorna error si el archivo tiene formato inválido", async () => {
    mockValidateImageFile.mockReturnValueOnce({
      valid: false,
      error: "Formato no permitido. Solo se aceptan JPEG y WebP.",
    })
    const result = await uploadGalleryImageAction(makeFormData("image/png"))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Formato no permitido/)
  })

  it("retorna error si el archivo supera 10MB", async () => {
    mockValidateImageFile.mockReturnValueOnce({
      valid: false,
      error: "El archivo supera el límite de 10MB.",
    })
    const result = await uploadGalleryImageAction(makeFormData("image/jpeg", 11 * 1024 * 1024))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/10MB/)
  })

  it("retorna success con id y url cuando todo es correcto", async () => {
    const result = await uploadGalleryImageAction(makeFormData())
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe("img-1")
    expect(result.data?.url).toBe("https://example.com/gallery/test-uuid-1234.jpg")
  })

  it("crea AuditLog con acción GALLERY_IMAGE_UPLOADED", async () => {
    await uploadGalleryImageAction(makeFormData())
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "GALLERY_IMAGE_UPLOADED",
          entityId: "img-1",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})

// ─── deleteGalleryImageAction ─────────────────────────────────────────────────

describe("deleteGalleryImageAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockFindFirst.mockResolvedValue(createdImage as never)
    mockUpdate.mockResolvedValue(createdImage as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await deleteGalleryImageAction("img-1")
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si la imagen no existe", async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const result = await deleteGalleryImageAction("nonexistent")
    expect(result.success).toBe(false)
    expect(result.error).toBe("Imagen no encontrada")
  })

  it("retorna success y hace soft delete", async () => {
    const result = await deleteGalleryImageAction("img-1")
    expect(result.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "img-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    )
  })

  it("crea AuditLog con acción GALLERY_IMAGE_DELETED", async () => {
    await deleteGalleryImageAction("img-1")
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "GALLERY_IMAGE_DELETED",
          entityId: "img-1",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})

// ─── reorderGalleryAction ─────────────────────────────────────────────────────

describe("reorderGalleryAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockTransaction.mockResolvedValue([])
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await reorderGalleryAction(["img-1", "img-2"])
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna success con array vacío sin llamar a transaction", async () => {
    const result = await reorderGalleryAction([])
    expect(result.success).toBe(true)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it("actualiza el orden de las imágenes en una transaction", async () => {
    await reorderGalleryAction(["img-2", "img-1", "img-3"])
    expect(mockTransaction).toHaveBeenCalled()
  })
})
