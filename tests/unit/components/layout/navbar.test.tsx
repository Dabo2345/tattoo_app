// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Navbar } from "@/components/layout/navbar"

describe("Navbar", () => {
  it("renderiza los links de navegación", () => {
    render(<Navbar />)
    expect(screen.getByText("Galería")).toBeInTheDocument()
    expect(screen.getByText("Artista")).toBeInTheDocument()
    expect(screen.getByText("Estudio")).toBeInTheDocument()
  })

  it("renderiza el link de reservar", () => {
    render(<Navbar />)
    const reservarLinks = screen.getAllByText("Reservar")
    expect(reservarLinks.length).toBeGreaterThan(0)
  })

  it("renderiza el logo con link a home", () => {
    render(<Navbar />)
    const logo = screen.getByText("Tattoo Studio")
    expect(logo.closest("a")).toHaveAttribute("href", "/")
  })
})
