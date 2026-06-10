// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import PerfilPage from "@/app/(public)/perfil/page"
import { artistProfile } from "@/modules/content/data/artist-profile"

describe("PerfilPage", () => {
  it("renders the artist name as H1", () => {
    render(<PerfilPage />)
    expect(screen.getByRole("heading", { level: 1, name: artistProfile.name })).toBeInTheDocument()
  })

  it("renders the bio section", () => {
    render(<PerfilPage />)
    expect(screen.getByRole("region", { name: /sobre mí/i })).toBeInTheDocument()
    expect(screen.getByText(artistProfile.bio)).toBeInTheDocument()
  })

  it("renders all specialties", () => {
    render(<PerfilPage />)
    artistProfile.specialties.forEach((s) => {
      expect(screen.getByText(s)).toBeInTheDocument()
    })
  })

  it("hero CTA links to /reservar", () => {
    render(<PerfilPage />)
    const links = screen.getAllByRole("link", { name: /reservar consulta/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute("href", "/reservar")
  })

  it("gallery link navigates to /galeria", () => {
    render(<PerfilPage />)
    const link = screen.getByRole("link", { name: /ver galería/i })
    expect(link).toHaveAttribute("href", "/galeria")
  })
})
