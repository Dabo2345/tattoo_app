// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import EstudioPage from "@/app/(public)/estudio/page"
import { studioInfo } from "@/modules/content/data/studio-info"

describe("EstudioPage", () => {
  it("renders the studio name as H1", () => {
    render(<EstudioPage />)
    expect(screen.getByRole("heading", { level: 1, name: studioInfo.name })).toBeInTheDocument()
  })

  it("renders the address", () => {
    render(<EstudioPage />)
    expect(screen.getByText(studioInfo.address, { exact: false })).toBeInTheDocument()
  })

  it("renders working hours", () => {
    render(<EstudioPage />)
    studioInfo.workingHours.forEach(({ day }) => {
      expect(screen.getByText(day)).toBeInTheDocument()
    })
  })

  it("CTA links to /reservar", () => {
    render(<EstudioPage />)
    const link = screen.getByRole("link", { name: /reservar consulta/i })
    expect(link).toHaveAttribute("href", "/reservar")
  })

  it("renders hygiene section", () => {
    render(<EstudioPage />)
    expect(screen.getByText(/higiene y seguridad/i)).toBeInTheDocument()
  })
})
