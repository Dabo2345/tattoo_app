// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    artistProfile: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/db/prisma"
import PerfilPage from "@/app/(public)/perfil/page"

const mockFindUnique = vi.mocked(prisma.artistProfile.findUnique)

const fakeProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Alex Moreno",
  bio: "Tatuador con más de una década de experiencia en blackwork y realismo.",
  specialties: ["Blackwork", "Realismo", "Geometric"],
  instagramHandle: "alexmoreno.ink",
  yearsOfExperience: 12,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PerfilPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the artist name from DB as H1", async () => {
    mockFindUnique.mockResolvedValue(fakeProfile)
    render(await PerfilPage())
    expect(screen.getByRole("heading", { level: 1, name: fakeProfile.name })).toBeInTheDocument()
  })

  it("renders the bio section with DB content", async () => {
    mockFindUnique.mockResolvedValue(fakeProfile)
    render(await PerfilPage())
    expect(screen.getByRole("region", { name: /sobre mí/i })).toBeInTheDocument()
    expect(screen.getByText(fakeProfile.bio)).toBeInTheDocument()
  })

  it("renders all specialties from DB", async () => {
    mockFindUnique.mockResolvedValue(fakeProfile)
    render(await PerfilPage())
    for (const specialty of fakeProfile.specialties) {
      expect(screen.getByText(specialty)).toBeInTheDocument()
    }
  })

  it("shows fallback name when profile does not exist in DB", async () => {
    mockFindUnique.mockResolvedValue(null)
    render(await PerfilPage())
    expect(screen.getByRole("heading", { level: 1, name: "El artista" })).toBeInTheDocument()
  })

  it("does not render bio section when profile has no bio", async () => {
    mockFindUnique.mockResolvedValue(null)
    render(await PerfilPage())
    expect(screen.queryByRole("region", { name: /sobre mí/i })).not.toBeInTheDocument()
  })

  it("CTA links to /reservar", async () => {
    mockFindUnique.mockResolvedValue(fakeProfile)
    render(await PerfilPage())
    const links = screen.getAllByRole("link", { name: /reservar consulta/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute("href", "/reservar")
  })
})
