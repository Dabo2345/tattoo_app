// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    studioInfo: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/db/prisma"
import EstudioPage from "@/app/(public)/estudio/page"

const mockFindUnique = vi.mocked(prisma.studioInfo.findUnique)

const fakeStudio = {
  id: "00000000-0000-0000-0000-000000000002",
  name: "Tattoo Studio",
  description: "Un espacio íntimo y profesional donde el arte y la higiene son lo primero.",
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

describe("EstudioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the studio name from DB as H1", async () => {
    mockFindUnique.mockResolvedValue(fakeStudio)
    render(await EstudioPage())
    expect(screen.getByRole("heading", { level: 1, name: fakeStudio.name })).toBeInTheDocument()
  })

  it("renders the address from DB", async () => {
    mockFindUnique.mockResolvedValue(fakeStudio)
    render(await EstudioPage())
    expect(screen.getByText(fakeStudio.address, { exact: false })).toBeInTheDocument()
  })

  it("renders hygiene section", async () => {
    mockFindUnique.mockResolvedValue(fakeStudio)
    render(await EstudioPage())
    expect(screen.getByText(/higiene y seguridad/i)).toBeInTheDocument()
  })

  it("shows fallback name when studio info does not exist in DB", async () => {
    mockFindUnique.mockResolvedValue(null)
    render(await EstudioPage())
    expect(screen.getByRole("heading", { level: 1, name: "Estudio" })).toBeInTheDocument()
  })

  it("does not render contact section when studio has no data", async () => {
    mockFindUnique.mockResolvedValue(null)
    render(await EstudioPage())
    expect(screen.queryByText(/información práctica/i)).not.toBeInTheDocument()
  })

  it("CTA links to /reservar", async () => {
    mockFindUnique.mockResolvedValue(fakeStudio)
    render(await EstudioPage())
    const link = screen.getByRole("link", { name: /reservar consulta/i })
    expect(link).toHaveAttribute("href", "/reservar")
  })
})
