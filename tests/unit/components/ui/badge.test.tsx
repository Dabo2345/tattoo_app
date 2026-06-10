// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Confirmado</Badge>)
    expect(screen.getByText("Confirmado")).toBeInTheDocument()
  })

  it("renders with default variant when no variant specified", () => {
    render(<Badge data-testid="badge">Default</Badge>)
    expect(screen.getByTestId("badge")).toBeInTheDocument()
  })

  it("renders success variant", () => {
    render(
      <Badge variant="success" data-testid="badge">
        Éxito
      </Badge>
    )
    expect(screen.getByTestId("badge")).toBeInTheDocument()
    expect(screen.getByText("Éxito")).toBeInTheDocument()
  })

  it("renders error variant", () => {
    render(<Badge variant="error">Error</Badge>)
    expect(screen.getByText("Error")).toBeInTheDocument()
  })

  it("renders warning variant", () => {
    render(<Badge variant="warning">Advertencia</Badge>)
    expect(screen.getByText("Advertencia")).toBeInTheDocument()
  })

  it("renders info variant", () => {
    render(<Badge variant="info">Info</Badge>)
    expect(screen.getByText("Info")).toBeInTheDocument()
  })

  it("forwards className", () => {
    render(
      <Badge className="custom" data-testid="badge">
        texto
      </Badge>
    )
    expect(screen.getByTestId("badge")).toHaveClass("custom")
  })
})
