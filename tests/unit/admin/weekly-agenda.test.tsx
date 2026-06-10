// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { WeeklyAgenda } from "@/components/admin/weekly-agenda"

// ─── Fixtures ────────────────────────────────────────────────────────────────

// Monday 2026-07-13 00:00:00 UTC
const FIXED_NOW = new Date("2026-07-13T00:00:00.000Z")

const appointment = {
  id: "apt-1",
  type: "CONSULTATION" as const,
  status: "CONFIRMED" as const,
  startsAt: "2026-07-13T10:00:00.000Z",
  endsAt: "2026-07-13T11:00:00.000Z",
  client: { name: "Ana García", email: "ana@example.com", phone: "+34 600 000 000" },
}

const cancelledAppointment = {
  ...appointment,
  id: "apt-2",
  status: "CANCELLED" as const,
  client: { name: "Luis Pérez", email: "luis@example.com" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFetchSuccess(appointments = [appointment]) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { appointments } }),
  } as Response)
}

function mockFetchError(message = "Error del servidor") {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: false,
    json: async () => ({ success: false, error: { message } }),
  } as Response)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WeeklyAgenda", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renderiza los 7 días de la semana (Lun–Dom)", async () => {
    mockFetchSuccess([])
    render(<WeeklyAgenda />)

    await waitFor(() => {
      expect(screen.getByText(/lun/i)).toBeInTheDocument()
      expect(screen.getByText(/dom/i)).toBeInTheDocument()
    })

    // All 7 day name prefixes present
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    for (const name of dayNames) {
      expect(screen.getByText(new RegExp(name))).toBeInTheDocument()
    }
  })

  it("muestra estado loading mientras se carga la API", () => {
    vi.mocked(global.fetch).mockReturnValue(new Promise(() => {}))
    render(<WeeklyAgenda />)
    expect(screen.getByLabelText(/cargando agenda/i)).toBeInTheDocument()
  })

  it("renderiza una cita en el día correcto", async () => {
    mockFetchSuccess([appointment])
    render(<WeeklyAgenda />)

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeInTheDocument()
    })
  })

  it("muestra guiones cuando un día no tiene citas", async () => {
    mockFetchSuccess([])
    render(<WeeklyAgenda />)

    await waitFor(() => {
      // 7 empty columns each with "—"
      expect(screen.getAllByText("—").length).toBe(7)
    })
  })

  it("muestra mensaje de semana vacía cuando no hay citas", async () => {
    mockFetchSuccess([])
    render(<WeeklyAgenda />)

    await waitFor(() => {
      expect(screen.getByText(/no hay citas esta semana/i)).toBeInTheDocument()
    })
  })

  it("click en cita muestra el panel de detalle", async () => {
    mockFetchSuccess([appointment])
    render(<WeeklyAgenda />)

    await waitFor(() => screen.getByText("Ana García"))
    fireEvent.click(screen.getByText("Ana García").closest("button")!)

    expect(screen.getByRole("region", { name: /detalle de cita/i })).toBeInTheDocument()
    expect(screen.getByText("ana@example.com")).toBeInTheDocument()
    expect(screen.getByText("+34 600 000 000")).toBeInTheDocument()
  })

  it("botón cerrar oculta el panel de detalle", async () => {
    mockFetchSuccess([appointment])
    render(<WeeklyAgenda />)

    await waitFor(() => screen.getByText("Ana García"))
    fireEvent.click(screen.getByText("Ana García").closest("button")!)
    expect(screen.getByRole("region", { name: /detalle de cita/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /cerrar detalle/i }))
    expect(screen.queryByRole("region", { name: /detalle de cita/i })).not.toBeInTheDocument()
  })

  it("botón 'Semana siguiente' avanza y hace nuevo fetch", async () => {
    mockFetchSuccess([])
    render(<WeeklyAgenda />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    mockFetchSuccess([])
    fireEvent.click(screen.getByRole("button", { name: /semana siguiente/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))

    const secondCall = vi.mocked(global.fetch).mock.calls[1]![0] as string
    expect(secondCall).toContain("/api/admin/calendar")
    // from param should be 7 days after FIXED_NOW's Monday
    expect(secondCall).toContain("2026-07-20")
  })

  it("botón 'Semana anterior' retrocede y hace nuevo fetch", async () => {
    mockFetchSuccess([])
    render(<WeeklyAgenda />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    mockFetchSuccess([])
    fireEvent.click(screen.getByRole("button", { name: /semana anterior/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))

    const secondCall = vi.mocked(global.fetch).mock.calls[1]![0] as string
    expect(secondCall).toContain("2026-07-06")
  })

  it("botón 'Hoy' regresa a la semana actual y hace nuevo fetch", async () => {
    mockFetchSuccess([])
    render(<WeeklyAgenda />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    // Navigate away first
    mockFetchSuccess([])
    fireEvent.click(screen.getByRole("button", { name: /semana siguiente/i }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))

    // "Hoy" button should appear
    expect(screen.getByRole("button", { name: /hoy/i })).toBeInTheDocument()

    mockFetchSuccess([])
    fireEvent.click(screen.getByRole("button", { name: /hoy/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3))

    const thirdCall = vi.mocked(global.fetch).mock.calls[2]![0] as string
    expect(thirdCall).toContain("2026-07-13")
  })

  it("error de API muestra mensaje de error con botón de reintentar", async () => {
    mockFetchError("Error del servidor")
    render(<WeeklyAgenda />)

    await waitFor(() => {
      expect(screen.getByText(/error del servidor/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument()
    })
  })
})
