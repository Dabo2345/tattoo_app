import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    artistProfile: {
      findUnique: vi.fn(),
    },
  },
}))

import { GET } from "@/app/api/content/profile/route"
import { prisma } from "@/lib/db/prisma"

const mockFindUnique = vi.mocked(prisma.artistProfile.findUnique)

const ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"

const fakeProfile = {
  id: ARTIST_PROFILE_ID,
  name: "Alex Moreno",
  bio: "Tatuador con más de una década de experiencia.",
  specialties: ["Blackwork", "Realismo"],
  instagramHandle: "alexmoreno.ink",
  yearsOfExperience: 12,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/content/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 with profile data from DB", async () => {
    mockFindUnique.mockResolvedValue(fakeProfile)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.name).toBe(fakeProfile.name)
    expect(body.data.specialties).toEqual(fakeProfile.specialties)
  })

  it("returns 404 when profile does not exist in DB", async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("queries DB with the correct singleton ID", async () => {
    mockFindUnique.mockResolvedValue(fakeProfile)
    await GET()
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: ARTIST_PROFILE_ID } })
  })
})
