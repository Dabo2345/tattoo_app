// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { WeeklyAgenda, type Appointment } from "@/components/admin/weekly-agenda"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-07-13T00:00:00.000Z")

const confirmedAppointment = {
  id: "apt-1",
  type: "CONSULTATION" as const,
  status: "CONFIRMED" as const,
  startsAt: "2026-07-13T10:00:00.000Z",
  endsAt: "2026-07-13T11:00:00.000Z",
  client: { name: "Ana García", email: "ana@example.com", phone: "+34600000000" },
}

const cancelledAppointment = {
  id: "apt-2",
  type: "CONSULTATION" as const,
  status: "CANCELLED" as const,
  startsAt: "2026-07-13T10:00:00.000Z",
  endsAt: "2026-07-13T11:00:00.000Z",
  client: { name: "Luis Pérez", email: "luis@example.com", phone: "+34600000001" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFetchSuccess(appointments: Appointment[] = [confirmedAppointment]) {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { appointments } }),
  } as Response)
}

function mockActionSuccess() {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      data: { appointment: { id: "apt-1", status: "CANCELLED" } },
    }),
  } as Response)
}

function mockActionError(message = "Error del servidor") {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ success: false, error: { message } }),
  } as Response)
}

async function openDetailPanel(name = "Ana García") {
  await waitFor(() => screen.getByText(name))
  fireEvent.click(screen.getByText(name).closest("button")!)
  await waitFor(() => screen.getByRole("region", { name: /detalle de cita/i }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WeeklyAgenda — acciones Cancel/Reschedule", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("muestra botones Reprogramar y Cancelar en cita CONFIRMED", async () => {
    mockFetchSuccess([confirmedAppointment])
    render(<WeeklyAgenda />)
    await openDetailPanel()

    expect(screen.getByRole("button", { name: /reprogramar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancelar cita/i })).toBeInTheDocument()
  })

  it("NO muestra botones de acción en cita CANCELLED", async () => {
    mockFetchSuccess([cancelledAppointment])
    render(<WeeklyAgenda />)
    await openDetailPanel("Luis Pérez")

    expect(screen.queryByRole("button", { name: /reprogramar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /cancelar cita/i })).not.toBeInTheDocument()
  })

  it("click Cancelar muestra pantalla de confirmación", async () => {
    mockFetchSuccess([confirmedAppointment])
    render(<WeeklyAgenda />)
    await openDetailPanel()

    fireEvent.click(screen.getByRole("button", { name: /cancelar cita/i }))

    expect(screen.getByRole("button", { name: /confirmar cancelación/i })).toBeInTheDocument()
    expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument()
  })

  it("confirmar cancelación llama al endpoint correcto y refresca", async () => {
    mockFetchSuccess([confirmedAppointment])
    render(<WeeklyAgenda />)
    await openDetailPanel()

    fireEvent.click(screen.getByRole("button", { name: /cancelar cita/i }))

    // Setup: action call + refetch
    mockActionSuccess()
    mockFetchSuccess([])

    fireEvent.click(screen.getByRole("button", { name: /confirmar cancelación/i }))

    await waitFor(() => {
      const calls = vi.mocked(global.fetch).mock.calls
      const cancelCall = calls.find(([url]) => typeof url === "string" && url.includes("/cancel"))
      expect(cancelCall).toBeDefined()
      expect(cancelCall![1]?.method).toBe("POST")
    })
  })

  it("click Reprogramar muestra formulario con input de fecha", async () => {
    mockFetchSuccess([confirmedAppointment])
    render(<WeeklyAgenda />)
    await openDetailPanel()

    fireEvent.click(screen.getByRole("button", { name: /reprogramar/i }))

    expect(screen.getByLabelText(/fecha y hora/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument()
  })

  it("tras reschedule exitoso cierra el panel y refresca", async () => {
    mockFetchSuccess([confirmedAppointment])
    render(<WeeklyAgenda />)
    await openDetailPanel()

    fireEvent.click(screen.getByRole("button", { name: /reprogramar/i }))

    // Fill datetime-local input
    const input = screen.getByLabelText(/fecha y hora/i)
    fireEvent.change(input, { target: { value: "2026-07-20T11:00" } })
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    // Setup: reschedule call + refetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          appointment: {
            id: "apt-1",
            startsAt: "2026-07-20T11:00:00.000Z",
            endsAt: "2026-07-20T12:00:00.000Z",
          },
        },
      }),
    } as Response)
    mockFetchSuccess([])

    fireEvent.click(screen.getByRole("button", { name: /confirmar reprogramación/i }))

    await waitFor(() => {
      const calls = vi.mocked(global.fetch).mock.calls
      const rescheduleCall = calls.find(
        ([url]) => typeof url === "string" && url.includes("/reschedule")
      )
      expect(rescheduleCall).toBeDefined()
    })
  })

  it("error en cancelación muestra mensaje y permite reintentar", async () => {
    mockFetchSuccess([confirmedAppointment])
    render(<WeeklyAgenda />)
    await openDetailPanel()

    fireEvent.click(screen.getByRole("button", { name: /cancelar cita/i }))
    mockActionError("La cita no puede cancelarse en su estado actual")

    fireEvent.click(screen.getByRole("button", { name: /confirmar cancelación/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/La cita no puede cancelarse/i)
    })

    // Button should still be visible to retry
    expect(screen.getByRole("button", { name: /confirmar cancelación/i })).toBeInTheDocument()
  })
})
