import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/storage", () => ({
  validateImageFile: vi.fn(),
  uploadImage: vi.fn(),
  getPublicUrl: vi.fn(),
}))

vi.mock("@/modules/gallery/repositories/gallery-repository", () => ({
  galleryRepository: {
    findById: vi.fn(),
    getMaxOrder: vi.fn(),
    create: vi.fn(),
    softDelete: vi.fn(),
    updateOrders: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

vi.mock("crypto", async (importOriginal) => {
  const original = await importOriginal<typeof import("crypto")>()
  return { ...original, randomUUID: vi.fn(() => "test-uuid-1234") }
})

import * as storage from "@/lib/supabase/storage"
import { galleryRepository } from "@/modules/gallery/repositories/gallery-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { galleryService } from "@/modules/gallery/services/gallery-service"

const mockValidateImageFile = vi.mocked(storage.validateImageFile)
const mockUploadImage = vi.mocked(storage.uploadImage)
const mockGetPublicUrl = vi.mocked(storage.getPublicUrl)
const mockFindById = vi.mocked(galleryRepository.findById)
const mockGetMaxOrder = vi.mocked(galleryRepository.getMaxOrder)
const mockCreate = vi.mocked(galleryRepository.create)
const mockSoftDelete = vi.mocked(galleryRepository.softDelete)
const mockUpdateOrders = vi.mocked(galleryRepository.updateOrders)
const mockAuditLog = vi.mocked(auditService.log)

const validImage = {
  id: "img-1",
  url: "https://example.com/gallery/test-uuid-1234.jpg",
  thumbnailUrl: "https://example.com/gallery/test-uuid-1234.jpg",
  altText: null,
  order: 0,
}

// ─── upload ───────────────────────────────────────────────────────────────────

describe("galleryService.upload", () => {
  const file = new File(["x".repeat(1024)], "test.jpg", { type: "image/jpeg" })
  const options = { styleTagIds: [], adminUserId: "admin-1" }

  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateImageFile.mockReturnValue({ valid: true, mimeType: "image/jpeg", extension: "jpg" })
    mockUploadImage.mockResolvedValue({ path: "gallery/test-uuid-1234.jpg" })
    mockGetPublicUrl.mockReturnValue("https://example.com/gallery/test-uuid-1234.jpg")
    mockGetMaxOrder.mockResolvedValue(0)
    mockCreate.mockResolvedValue(validImage)
    mockAuditLog.mockResolvedValue(undefined)
  })

  it("devuelve la imagen creada con id y url", async () => {
    const result = await galleryService.upload(file, options)
    expect(result.id).toBe("img-1")
    expect(result.url).toBe("https://example.com/gallery/test-uuid-1234.jpg")
  })

  it("lanza error si el archivo no pasa la validación", async () => {
    mockValidateImageFile.mockReturnValueOnce({ valid: false, error: "Formato no permitido" })
    await expect(galleryService.upload(file, options)).rejects.toThrow("Formato no permitido")
  })

  it("no llama a uploadImage si la validación falla", async () => {
    mockValidateImageFile.mockReturnValueOnce({ valid: false, error: "Demasiado grande" })
    await expect(galleryService.upload(file, options)).rejects.toThrow()
    expect(mockUploadImage).not.toHaveBeenCalled()
  })

  it("usa el orden devuelto por getMaxOrder para crear la imagen", async () => {
    mockGetMaxOrder.mockResolvedValueOnce(5)
    await galleryService.upload(file, options)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ order: 5 }))
  })

  it("registra audit log GALLERY_IMAGE_UPLOADED", async () => {
    await galleryService.upload(file, options)
    expect(mockAuditLog).toHaveBeenCalledWith(
      "GALLERY_IMAGE_UPLOADED",
      "img-1",
      expect.objectContaining({ adminUserId: "admin-1", entityType: "GalleryImage" })
    )
  })

  it("pasa styleTagIds al repositorio", async () => {
    await galleryService.upload(file, { ...options, styleTagIds: ["tag-1", "tag-2"] })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ styleTagIds: ["tag-1", "tag-2"] })
    )
  })
})

// ─── softDelete ───────────────────────────────────────────────────────────────

describe("galleryService.softDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindById.mockResolvedValue(validImage)
    mockSoftDelete.mockResolvedValue(undefined)
    mockAuditLog.mockResolvedValue(undefined)
  })

  it("llama a softDelete del repositorio con el id correcto", async () => {
    await galleryService.softDelete("img-1", "admin-1")
    expect(mockSoftDelete).toHaveBeenCalledWith("img-1")
  })

  it("lanza error si la imagen no existe", async () => {
    mockFindById.mockResolvedValueOnce(null)
    await expect(galleryService.softDelete("nonexistent", "admin-1")).rejects.toThrow(
      "Imagen no encontrada"
    )
  })

  it("no llama a softDelete si la imagen no existe", async () => {
    mockFindById.mockResolvedValueOnce(null)
    await expect(galleryService.softDelete("nonexistent", "admin-1")).rejects.toThrow()
    expect(mockSoftDelete).not.toHaveBeenCalled()
  })

  it("registra audit log GALLERY_IMAGE_DELETED", async () => {
    await galleryService.softDelete("img-1", "admin-1")
    expect(mockAuditLog).toHaveBeenCalledWith(
      "GALLERY_IMAGE_DELETED",
      "img-1",
      expect.objectContaining({ adminUserId: "admin-1", entityType: "GalleryImage" })
    )
  })
})

// ─── reorder ──────────────────────────────────────────────────────────────────

describe("galleryService.reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateOrders.mockResolvedValue(undefined)
  })

  it("llama a updateOrders con id e índice correctos", async () => {
    await galleryService.reorder(["img-2", "img-1", "img-3"])
    expect(mockUpdateOrders).toHaveBeenCalledWith([
      { id: "img-2", order: 0 },
      { id: "img-1", order: 1 },
      { id: "img-3", order: 2 },
    ])
  })

  it("no llama a updateOrders si el array está vacío", async () => {
    await galleryService.reorder([])
    expect(mockUpdateOrders).not.toHaveBeenCalled()
  })
})
