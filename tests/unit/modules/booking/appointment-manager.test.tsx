// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import {
  AppointmentManager,
  type AppointmentData,
} from "@/modules/booking/components/appointment-manager"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const confirmed: AppointmentData = {
  id: "apt-123",
  type: "CONSULTATION",
  status: "CONFIRMED",
  startsAt: "2026-07-15T10:00:00.000Z",
  endsAt: "2026-07-15T11:00:00.000Z",
  client: { name: "Ana García", email: "ana@example.com" },
}

const cancelled: AppointmentData = {
  ...confirmed,
  id: "apt-456",
  status: "CANCELLED",
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AppointmentManager", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  it("renderiza los detalles de la cita confirmada", () => {
    render(<AppointmentManager appointment={confirmed} />)
    expect(screen.getByText("Consulta")).toBeInTheDocument()
    expect(screen.getByText("Confirmada")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /reprogramar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancelar cita/i })).toBeInTheDocument()
  })

  it("cita no confirmada no muestra botones de acción", () => {
    render(<AppointmentManager appointment={cancelled} />)
    expect(screen.queryByRole("button", { name: /cancelar cita/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /reprogramar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/no puede modificarse/i)).toBeInTheDocument()
  })

  // ── Cancel flow ────────────────────────────────────────────────────────────

  it("botón cancelar muestra confirmación inline", () => {
    render(<AppointmentManager appointment={confirmed} />)

    fireEvent.click(screen.getByRole("button", { name: /cancelar cita/i }))

    expect(screen.getByText(/confirmas la cancelación/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /no, volver/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /confirmar cancelación/i })).toBeInTheDocument()
  })

  it("confirmación de cancelación llama a POST /api/appointments/:id/cancel", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<AppointmentManager appointment={confirmed} />)

    fireEvent.click(screen.getByRole("button", { name: /cancelar cita/i }))
    fireEvent.click(screen.getByRole("button", { name: /confirmar cancelación/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/appointments/${confirmed.id}/cancel`,
        expect.objectContaining({ method: "POST" })
      )
    })

    expect(screen.getByText(/cita cancelada/i)).toBeInTheDocument()
  })

  it("cancel muestra error si la API falla", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: { message: "No se puede cancelar" } }),
    } as Response)

    render(<AppointmentManager appointment={confirmed} />)

    fireEvent.click(screen.getByRole("button", { name: /cancelar cita/i }))
    fireEvent.click(screen.getByRole("button", { name: /confirmar cancelación/i }))

    await waitFor(() => {
      expect(screen.getByText(/no se puede cancelar/i)).toBeInTheDocument()
    })
  })

  it("volver desde confirmación restaura vista de detalle", () => {
    render(<AppointmentManager appointment={confirmed} />)

    fireEvent.click(screen.getByRole("button", { name: /cancelar cita/i }))
    expect(screen.getByText(/confirmas la cancelación/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /no, volver/i }))
    expect(screen.queryByText(/confirmas la cancelación/i)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancelar cita/i })).toBeInTheDocument()
  })

  // ── Reschedule flow ────────────────────────────────────────────────────────

  it("botón reprogramar muestra selector de fecha", () => {
    render(<AppointmentManager appointment={confirmed} />)

    fireEvent.click(screen.getByRole("button", { name: /reprogramar/i }))

    expect(screen.getByText(/selecciona una nueva fecha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nueva fecha/i)).toBeInTheDocument()
  })

  it("con fecha seleccionada llama a /api/availability y muestra slots", async () => {
    const slots = [
      { startsAt: "2026-07-20T09:00:00.000Z", endsAt: "2026-07-20T10:00:00.000Z" },
      { startsAt: "2026-07-20T11:00:00.000Z", endsAt: "2026-07-20T12:00:00.000Z" },
    ]
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: slots }),
    } as Response)

    render(<AppointmentManager appointment={confirmed} />)

    fireEvent.click(screen.getByRole("button", { name: /reprogramar/i }))

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/nueva fecha/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/availability"))
    })

    await waitFor(() => {
      expect(screen.getByText("09:00")).toBeInTheDocument()
      expect(screen.getByText("11:00")).toBeInTheDocument()
    })
  })

  it("con slot seleccionado llama a POST /api/appointments/:id/reschedule", async () => {
    const slots = [{ startsAt: "2026-07-20T09:00:00.000Z", endsAt: "2026-07-20T10:00:00.000Z" }]

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: slots }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

    render(<AppointmentManager appointment={confirmed} />)

    fireEvent.click(screen.getByRole("button", { name: /reprogramar/i }))

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/nueva fecha/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => screen.getByText("09:00"))

    fireEvent.click(screen.getByText("09:00"))
    fireEvent.click(screen.getByRole("button", { name: /confirmar reprogramación/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/appointments/${confirmed.id}/reschedule`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ newStartAt: slots[0].startsAt }),
        })
      )
    })

    expect(screen.getByText(/cita reprogramada/i)).toBeInTheDocument()
  })
})
