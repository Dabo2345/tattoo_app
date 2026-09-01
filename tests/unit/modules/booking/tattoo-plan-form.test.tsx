// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TattooPlanForm } from "@/modules/booking/components/tattoo-plan-form"

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fillRequiredFields() {
  // Estilo
  fireEvent.change(screen.getByLabelText(/estilo/i), { target: { value: "Blackwork" } })
  // Tamaño
  fireEvent.change(screen.getByLabelText(/tamaño/i), { target: { value: "medium" } })
  // Placement
  fireEvent.change(screen.getByLabelText(/placement/i), {
    target: { value: "Antebrazo izquierdo" },
  })
  // Descripción (min 20 chars)
  fireEvent.change(screen.getByLabelText(/descripción/i), {
    target: { value: "Diseño de dragón japonés con colores oscuros" },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TattooPlanForm", () => {
  const onSuccess = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza correctamente con todos los campos", () => {
    render(<TattooPlanForm appointmentId="apt-1" onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByLabelText(/estilo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tamaño/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/placement/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notas del artista/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /guardar plan/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument()
  })

  it("muestra la primera sesión por defecto", () => {
    render(<TattooPlanForm appointmentId="apt-1" onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByRole("listitem")).toBeInTheDocument()
    expect(screen.getByText("Sesión 1")).toBeInTheDocument()
  })

  it("añadir sesión añade una nueva fila al formulario", async () => {
    render(<TattooPlanForm appointmentId="apt-1" onSuccess={onSuccess} onCancel={onCancel} />)

    const addBtn = screen.getByRole("button", { name: /añadir sesión/i })
    fireEvent.click(addBtn)

    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(screen.getByText("Sesión 2")).toBeInTheDocument()
  })

  it("eliminar sesión la borra (y no permite eliminar la última)", async () => {
    render(<TattooPlanForm appointmentId="apt-1" onSuccess={onSuccess} onCancel={onCancel} />)

    // With a single session, delete button should not exist
    expect(screen.queryByRole("button", { name: /eliminar sesión/i })).not.toBeInTheDocument()

    // Add a second session
    fireEvent.click(screen.getByRole("button", { name: /añadir sesión/i }))
    expect(screen.getAllByRole("listitem")).toHaveLength(2)

    // Delete button should now exist for each session
    const deleteBtns = screen.getAllByRole("button", { name: /eliminar sesión/i })
    expect(deleteBtns).toHaveLength(2)

    // Remove first session
    fireEvent.click(deleteBtns[0]!)
    expect(screen.getAllByRole("listitem")).toHaveLength(1)

    // Delete button should disappear when only one session remains
    expect(screen.queryByRole("button", { name: /eliminar sesión/i })).not.toBeInTheDocument()
  })

  it("submit con campos vacíos muestra errores de validación", async () => {
    render(<TattooPlanForm appointmentId="apt-1" onSuccess={onSuccess} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole("button", { name: /guardar plan/i }))

    expect(await screen.findByText(/el estilo es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/el tamaño es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/el placement es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/descripción debe tener al menos 20/i)).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("submit con datos válidos llama a la API con los datos correctos", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: "plan-1" } }),
    })

    render(<TattooPlanForm appointmentId="apt-123" onSuccess={onSuccess} onCancel={onCancel} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /guardar plan/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("/api/admin/appointments/apt-123/tattoo-plan")
    expect(options.method).toBe("POST")

    const body = JSON.parse(options.body as string)
    expect(body.style).toBe("Blackwork")
    expect(body.size).toBe("medium")
    expect(body.placement).toBe("Antebrazo izquierdo")
    expect(body.sessions).toHaveLength(1)
    expect(body.sessions[0].durationMinutes).toBe(60)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: "plan-1" }))
  })

  it("deshabilita el botón guardar durante el submit", async () => {
    let resolveFetch!: (v: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )

    render(<TattooPlanForm appointmentId="apt-1" onSuccess={onSuccess} onCancel={onCancel} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /guardar plan/i }))

    const btn = screen.getByRole("button", { name: /guardar plan/i })
    expect(btn).toBeDisabled()
    expect(screen.getByText(/guardando/i)).toBeInTheDocument()

    resolveFetch({ ok: true, json: async () => ({ success: true, data: { id: "p1" } }) })
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it("error de API muestra mensaje de error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: "Cita no válida para plan" } }),
    })

    render(<TattooPlanForm appointmentId="apt-1" onSuccess={onSuccess} onCancel={onCancel} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole("button", { name: /guardar plan/i }))

    expect(await screen.findByText(/cita no válida para plan/i)).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
