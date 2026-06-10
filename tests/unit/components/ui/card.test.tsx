// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText("Card content")).toBeInTheDocument()
  })

  it("renders full card structure", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
          <CardDescription>Descripción</CardDescription>
        </CardHeader>
        <CardContent>Contenido</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )
    expect(screen.getByText("Título")).toBeInTheDocument()
    expect(screen.getByText("Descripción")).toBeInTheDocument()
    expect(screen.getByText("Contenido")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })

  it("forwards className", () => {
    render(
      <Card className="custom" data-testid="card">
        content
      </Card>
    )
    expect(screen.getByTestId("card")).toHaveClass("custom")
  })
})
