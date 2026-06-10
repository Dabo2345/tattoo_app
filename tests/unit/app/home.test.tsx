// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import HomePage from "@/app/(public)/page"

describe("HomePage", () => {
  it("renders the main H1 heading", () => {
    render(<HomePage />)
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })

  it("hero CTA links to /reservar", () => {
    render(<HomePage />)
    const links = screen.getAllByRole("link", { name: /reservar consulta/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute("href", "/reservar")
  })

  it("hero secondary CTA links to /galeria", () => {
    render(<HomePage />)
    const link = screen.getByRole("link", { name: /ver galería$/i })
    expect(link).toHaveAttribute("href", "/galeria")
  })

  it("how-it-works section renders exactly 3 steps", () => {
    render(<HomePage />)
    const list = screen.getByRole("list", { name: /pasos del proceso/i })
    const steps = list.querySelectorAll("li")
    expect(steps).toHaveLength(3)
  })

  it("gallery teaser links to /galeria", () => {
    render(<HomePage />)
    const link = screen.getByRole("link", { name: /ver galería completa/i })
    expect(link).toHaveAttribute("href", "/galeria")
  })

  it("artist section links to /perfil", () => {
    render(<HomePage />)
    const link = screen.getByRole("link", { name: /conocer al artista/i })
    expect(link).toHaveAttribute("href", "/perfil")
  })

  it("final CTA links to /reservar", () => {
    render(<HomePage />)
    const links = screen.getAllByRole("link", { name: /reservar consulta/i })
    // Both hero and final CTA → at least 2 links to /reservar
    expect(links.length).toBeGreaterThanOrEqual(2)
    links.forEach((link) => expect(link).toHaveAttribute("href", "/reservar"))
  })

  it("sections are labelled for accessibility", () => {
    render(<HomePage />)
    expect(screen.getByRole("region", { name: /cómo funciona/i })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: /trabajos destacados/i })).toBeInTheDocument()
  })
})
