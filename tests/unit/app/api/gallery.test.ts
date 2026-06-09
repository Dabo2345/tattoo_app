import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ─── Mock repository ──────────────────────────────────────────────────────────

vi.mock("@/modules/gallery/repositories/gallery-repository", () => ({
  galleryRepository: {
    findAll: vi.fn(),
  },
}))

import { galleryRepository } from "@/modules/gallery/repositories/gallery-repository"
import { GET } from "@/app/api/gallery/route"

const mockFindAll = vi.mocked(galleryRepository.findAll)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockImages = [
  {
    id: "1",
    url: "https://example.com/img1.jpg",
    thumbnailUrl: "https://example.com/thumb1.jpg",
    altText: "Blackwork sleeve",
    order: 0,
    styleTags: [{ id: "t1", name: "Blackwork", slug: "blackwork" }],
  },
  {
    id: "2",
    url: "https://example.com/img2.jpg",
    thumbnailUrl: "https://example.com/thumb2.jpg",
    altText: null,
    order: 1,
    styleTags: [],
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/gallery", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 200 with images array", async () => {
    mockFindAll.mockResolvedValue(mockImages)

    const req = new NextRequest("http://localhost/api/gallery")
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ success: true, data: mockImages })
    expect(mockFindAll).toHaveBeenCalledWith(undefined)
  })

  it("passes tag parameter to repository when ?tag= is provided", async () => {
    mockFindAll.mockResolvedValue([mockImages[0]])

    const req = new NextRequest("http://localhost/api/gallery?tag=blackwork")
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockFindAll).toHaveBeenCalledWith("blackwork")
  })

  it("returns 500 when repository throws", async () => {
    mockFindAll.mockRejectedValue(new Error("DB error"))

    const req = new NextRequest("http://localhost/api/gallery")
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ success: false, error: "Error al obtener la galería" })
  })
})
