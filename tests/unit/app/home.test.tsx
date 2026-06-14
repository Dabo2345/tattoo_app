// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    galleryImage: {
      findMany: vi.fn(),
    },
    artistProfile: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/db/prisma"
import HomePage from "@/app/(public)/page"

const mockFindManyImages = vi.mocked(prisma.galleryImage.findMany)
const mockFindUniqueProfile = vi.mocked(prisma.artistProfile.findUnique)

const fakeProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Alex Moreno",
  bio: "Tatuador con más de una década de experiencia.",
  specialties: ["Blackwork", "Realismo"],
  instagramHandle: null,
  yearsOfExperience: 12,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const fakeImages = Array.from({ length: 3 }, (_, i) => ({
  id: `img-${i}`,
  url: `https://test.supabase.co/storage/v1/object/public/gallery/img-${i}.jpg`,
  thumbnailUrl: `https://test.supabase.co/storage/v1/object/public/gallery/img-${i}.jpg`,
  altText: `Imagen ${i}`,
  order: i,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  styleTags: [],
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindManyImages.mockResolvedValue([])
    mockFindUniqueProfile.mockResolvedValue(null)
  })

  it("renders the main H1 heading", async () => {
    render(await HomePage())
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })

  it("hero CTA links to /reservar", async () => {
    render(await HomePage())
    const links = screen.getAllByRole("link", { name: /reservar consulta/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute("href", "/reservar")
  })

  it("hero secondary CTA links to /galeria", async () => {
    render(await HomePage())
    const link = screen.getByRole("link", { name: /ver galería$/i })
    expect(link).toHaveAttribute("href", "/galeria")
  })

  it("how-it-works section renders exactly 3 steps", async () => {
    render(await HomePage())
    const list = screen.getByRole("list", { name: /pasos del proceso/i })
    const steps = list.querySelectorAll("li")
    expect(steps).toHaveLength(3)
  })

  it("gallery teaser links to /galeria", async () => {
    render(await HomePage())
    const link = screen.getByRole("link", { name: /ver galería completa/i })
    expect(link).toHaveAttribute("href", "/galeria")
  })

  it("artist section links to /perfil", async () => {
    render(await HomePage())
    const link = screen.getByRole("link", { name: /conocer al artista/i })
    expect(link).toHaveAttribute("href", "/perfil")
  })

  it("shows artist name from DB", async () => {
    mockFindUniqueProfile.mockResolvedValue(fakeProfile)
    render(await HomePage())
    expect(screen.getByText(fakeProfile.name)).toBeInTheDocument()
  })

  it("shows artist bio from DB", async () => {
    mockFindUniqueProfile.mockResolvedValue(fakeProfile)
    render(await HomePage())
    expect(screen.getByText(fakeProfile.bio)).toBeInTheDocument()
  })

  it("shows fallback artist text when no profile in DB", async () => {
    mockFindUniqueProfile.mockResolvedValue(null)
    render(await HomePage())
    expect(screen.getByText(/el artista detrás del estudio/i)).toBeInTheDocument()
  })

  it("shows placeholder gallery items when no images in DB", async () => {
    mockFindManyImages.mockResolvedValue([])
    render(await HomePage())
    const list = screen.getByRole("list", { name: /galería de trabajos destacados/i })
    expect(list.querySelectorAll("li")).toHaveLength(6)
  })

  it("shows real images when gallery has data", async () => {
    mockFindManyImages.mockResolvedValue(fakeImages)
    render(await HomePage())
    const list = screen.getByRole("list", { name: /galería de trabajos destacados/i })
    expect(list.querySelectorAll("li")).toHaveLength(fakeImages.length)
  })

  it("final CTA links to /reservar", async () => {
    render(await HomePage())
    const links = screen.getAllByRole("link", { name: /reservar consulta/i })
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it("sections are labelled for accessibility", async () => {
    render(await HomePage())
    expect(screen.getByRole("region", { name: /cómo funciona/i })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: /trabajos destacados/i })).toBeInTheDocument()
  })
})
