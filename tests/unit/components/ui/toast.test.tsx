// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest"
import { render, screen, act, fireEvent } from "@testing-library/react"
import { ToastProvider, useToast } from "@/components/ui/toast"

function TestConsumer({ type }: { type?: "success" | "error" | "info" | "warning" }) {
  const { toast } = useToast()
  return <button onClick={() => toast("Mensaje de prueba", type)}>Mostrar toast</button>
}

describe("ToastProvider + useToast", () => {
  it("renders children without toasts initially", () => {
    render(
      <ToastProvider>
        <p>Contenido</p>
      </ToastProvider>
    )
    expect(screen.getByText("Contenido")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("shows a toast when toast() is called", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Mostrar toast"))
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Mensaje de prueba")).toBeInTheDocument()
  })

  it("dismisses toast when close button is clicked", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Mostrar toast"))
    expect(screen.getByRole("alert")).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Cerrar notificación"))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("renders success type toast", () => {
    render(
      <ToastProvider>
        <TestConsumer type="success" />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText("Mostrar toast"))
    expect(screen.getByRole("alert")).toBeInTheDocument()
  })

  it("throws when useToast is used outside ToastProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow("useToast must be used within a ToastProvider")
    consoleError.mockRestore()
  })
})
