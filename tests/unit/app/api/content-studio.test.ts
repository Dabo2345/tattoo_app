import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    studioInfo: {
      findUnique: vi.fn(),
    },
  },
}))

import { GET } from "@/app/api/content/studio/route"
import { prisma } from "@/lib/db/prisma"

const mockFindUnique = vi.mocked(prisma.studioInfo.findUnique)

const STUDIO_INFO_ID = "00000000-0000-0000-0000-000000000002"

const fakeStudio = {
  id: STUDIO_INFO_ID,
  name: "Tattoo Studio",
  description: "Un estudio íntimo y profesional.",
  address: "Calle Mayor 42, Local 3",
  city: "Madrid, 28013",
  phone: "+34 600 000 000",
  email: "info@tattoostudio.com",
  instagramHandle: null,
  googleMapsUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/content/studio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 with studio data from DB", async () => {
    mockFindUnique.mockResolvedValue(fakeStudio)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.name).toBe(fakeStudio.name)
    expect(body.data.address).toBe(fakeStudio.address)
  })

  it("returns 404 when studio info does not exist in DB", async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("queries DB with the correct singleton ID", async () => {
    mockFindUnique.mockResolvedValue(fakeStudio)
    await GET()
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: STUDIO_INFO_ID } })
  })
})
