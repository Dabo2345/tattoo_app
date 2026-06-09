// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Modal } from "@/components/ui/modal"

describe("Modal", () => {
  it("renders content when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Contenido del modal</p>
      </Modal>
    )
    expect(screen.getByText("Contenido del modal")).toBeInTheDocument()
  })

  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Oculto</p>
      </Modal>
    )
    expect(screen.queryByText("Oculto")).not.toBeInTheDocument()
  })

  it("renders title when provided", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Mi Modal">
        Contenido
      </Modal>
    )
    expect(screen.getByText("Mi Modal")).toBeInTheDocument()
  })

  it("has aria-modal attribute", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Contenido
      </Modal>
    )
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true")
  })

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose}>
        Contenido
      </Modal>
    )
    fireEvent.click(screen.getByLabelText("Cerrar modal"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onClose when ESC key is pressed", () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose}>
        Contenido
      </Modal>
    )
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
