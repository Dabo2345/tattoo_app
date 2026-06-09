// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import { SessionBooking, type SessionLinkData } from "@/modules/booking/components/session-booking"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TOKEN = "tok_test_abc123"

const sessionData: SessionLinkData = {
  valid: true,
  expiresAt: "2026-08-01T12:00:00.000Z",
  durationMinutes: 180,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SessionBooking", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  it("renderiza los detalles de la sesión (duración y expiración)", () => {
    render(<SessionBooking token={TOKEN} data={sessionData} />)
    expect(screen.getByText(/180 minutos de sesión/i)).toBeInTheDocument()
    expect(screen.getByText(/enlace válido hasta/i)).toBeInTheDocument()
  })

  it("muestra el date picker en la vista inicial", () => {
    render(<SessionBooking token={TOKEN} data={sessionData} />)
    expect(screen.getByText(/selecciona una fecha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de la sesión/i)).toBeInTheDocument()
  })

  it("al seleccionar fecha llama a GET /api/availability con type=tattoo_session", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/availability.*type=tattoo_session/)
      )
    })
  })

  it("muestra los slots disponibles tras la respuesta de availability", async () => {
    const slots = [
      { startsAt: "2026-07-20T10:00:00.000Z", endsAt: "2026-07-20T13:00:00.000Z" },
      { startsAt: "2026-07-20T14:00:00.000Z", endsAt: "2026-07-20T17:00:00.000Z" },
    ]
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: slots }),
    } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => {
      expect(screen.getByText("10:00")).toBeInTheDocument()
      expect(screen.getByText("14:00")).toBeInTheDocument()
    })
  })

  it("sin slots disponibles muestra mensaje vacío", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/no hay horarios disponibles/i)).toBeInTheDocument()
    })
  })

  it("slot seleccionado muestra confirmación inline", async () => {
    const slots = [{ startsAt: "2026-07-20T10:00:00.000Z", endsAt: "2026-07-20T13:00:00.000Z" }]
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: slots }),
    } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => screen.getByText("10:00"))
    fireEvent.click(screen.getByText("10:00"))

    expect(screen.getByText(/confirmar reserva:/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /confirmar reserva de sesión/i })).toBeInTheDocument()
  })

  it("confirmar llama a POST /api/session-links/:token/book con startAt correcto", async () => {
    const slots = [{ startsAt: "2026-07-20T10:00:00.000Z", endsAt: "2026-07-20T13:00:00.000Z" }]

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: slots }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { appointmentId: "apt-999" } }),
      } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => screen.getByText("10:00"))
    fireEvent.click(screen.getByText("10:00"))
    fireEvent.click(screen.getByRole("button", { name: /confirmar reserva de sesión/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/session-links/${TOKEN}/book`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ startAt: slots[0]!.startsAt }),
        })
      )
    })
  })

  it("POST exitoso muestra vista de éxito", async () => {
    const slots = [{ startsAt: "2026-07-20T10:00:00.000Z", endsAt: "2026-07-20T13:00:00.000Z" }]

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: slots }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => screen.getByText("10:00"))
    fireEvent.click(screen.getByText("10:00"))
    fireEvent.click(screen.getByRole("button", { name: /confirmar reserva de sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/sesión reservada/i)).toBeInTheDocument()
    })
  })

  it("POST con SLOT_NOT_AVAILABLE muestra error y botón para elegir otro horario", async () => {
    const slots = [{ startsAt: "2026-07-20T10:00:00.000Z", endsAt: "2026-07-20T13:00:00.000Z" }]

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: slots }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { code: "SLOT_NOT_AVAILABLE", message: "El horario ya no está disponible" },
        }),
      } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => screen.getByText("10:00"))
    fireEvent.click(screen.getByText("10:00"))
    fireEvent.click(screen.getByRole("button", { name: /confirmar reserva de sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/el horario ya no está disponible/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /elegir otro horario/i })).toBeInTheDocument()
    })
  })

  it("POST con LINK_ALREADY_USED muestra vista de enlace ya utilizado", async () => {
    const slots = [{ startsAt: "2026-07-20T10:00:00.000Z", endsAt: "2026-07-20T13:00:00.000Z" }]

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: slots }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { code: "LINK_ALREADY_USED", message: "Este enlace ya fue utilizado" },
        }),
      } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => screen.getByText("10:00"))
    fireEvent.click(screen.getByText("10:00"))
    fireEvent.click(screen.getByRole("button", { name: /confirmar reserva de sesión/i }))

    await waitFor(() => {
      expect(screen.getByText(/enlace ya utilizado/i)).toBeInTheDocument()
    })
  })

  it("botón 'Cambiar fecha' regresa a la vista de date picker", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)

    render(<SessionBooking token={TOKEN} data={sessionData} />)

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/fecha de la sesión/i), {
        target: { value: "2026-07-20" },
      })
    })

    await waitFor(() => screen.getByRole("button", { name: /cambiar fecha/i }))
    fireEvent.click(screen.getByRole("button", { name: /cambiar fecha/i }))

    expect(screen.getByLabelText(/fecha de la sesión/i)).toBeInTheDocument()
  })
})
