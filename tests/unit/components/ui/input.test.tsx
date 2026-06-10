// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Input } from "@/components/ui/input"

describe("Input", () => {
  it("renders without label", () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument()
  })

  it("renders with label", () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByText("Email")).toBeInTheDocument()
  })

  it("renders error message and applies aria-invalid", () => {
    render(<Input label="Email" error="Email inválido" />)
    expect(screen.getByText("Email inválido")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true")
  })

  it("does not render error when no error prop", () => {
    render(<Input label="Email" />)
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "false")
  })

  it("renders helper text when no error", () => {
    render(<Input label="Email" helperText="Ej: nombre@email.com" />)
    expect(screen.getByText("Ej: nombre@email.com")).toBeInTheDocument()
  })

  it("error takes precedence over helperText", () => {
    render(<Input label="Email" error="Requerido" helperText="Ayuda" />)
    expect(screen.getByText("Requerido")).toBeInTheDocument()
    expect(screen.queryByText("Ayuda")).not.toBeInTheDocument()
  })

  it("forwards className to input element", () => {
    render(<Input className="custom-class" data-testid="input" />)
    expect(screen.getByTestId("input")).toHaveClass("custom-class")
  })
})
