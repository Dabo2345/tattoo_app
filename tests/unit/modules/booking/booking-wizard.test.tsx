// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BookingWizard } from "@/modules/booking/components/booking-wizard"

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockSlots = [
  { startsAt: "2026-08-10T10:00:00.000Z", endsAt: "2026-08-10T10:30:00.000Z" },
  { startsAt: "2026-08-10T11:00:00.000Z", endsAt: "2026-08-10T11:30:00.000Z" },
]

beforeEach(() => {
  vi.restoreAllMocks()
  global.fetch = vi.fn()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function navigateToFormStep() {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: mockSlots }),
  } as Response)

  render(<BookingWizard />)

  fireEvent.change(screen.getByLabelText(/fecha de la consulta/i), {
    target: { value: "2026-08-10" },
  })
  fireEvent.click(screen.getByRole("button", { name: /siguiente/i }))
  fireEvent.click(await screen.findByText("10:00"))
  fireEvent.click(screen.getByRole("button", { name: /siguiente.*datos/i }))
}

async function fillAndSubmitForm() {
  fireEvent.change(screen.getByLabelText(/nombre completo/i), {
    target: { value: "Ana García" },
  })
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "ana@example.com" },
  })
  fireEvent.change(screen.getByLabelText(/teléfono/i), {
    target: { value: "+34 600 123 456" },
  })
  fireEvent.change(screen.getByLabelText(/describe tu idea/i), {
    target: { value: "Quiero un tatuaje de mandala en el antebrazo izquierdo" },
  })
  fireEvent.click(screen.getByRole("button", { name: /confirmar reserva/i }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("BookingWizard", () => {
  it("renders date step by default", () => {
    render(<BookingWizard />)
    expect(screen.getByText(/selecciona una fecha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de la consulta/i)).toBeInTheDocument()
  })

  it("next button is disabled when no date is selected", () => {
    render(<BookingWizard />)
    const btn = screen.getByRole("button", { name: /siguiente/i })
    expect(btn).toBeDisabled()
  })

  it("next button is enabled after selecting a date", () => {
    render(<BookingWizard />)
    const input = screen.getByLabelText(/fecha de la consulta/i)
    fireEvent.change(input, { target: { value: "2026-08-10" } })
    expect(screen.getByRole("button", { name: /siguiente/i })).not.toBeDisabled()
  })

  it("shows slot step after selecting a date and clicking next", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockSlots }),
    } as Response)

    render(<BookingWizard />)
    fireEvent.change(screen.getByLabelText(/fecha de la consulta/i), {
      target: { value: "2026-08-10" },
    })
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }))

    expect(await screen.findByText(/elige un horario/i)).toBeInTheDocument()
  })

  it("shows form step after selecting a slot", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockSlots }),
    } as Response)

    render(<BookingWizard />)
    fireEvent.change(screen.getByLabelText(/fecha de la consulta/i), {
      target: { value: "2026-08-10" },
    })
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }))

    const slotBtn = await screen.findByText("10:00")
    fireEvent.click(slotBtn)
    fireEvent.click(screen.getByRole("button", { name: /siguiente.*datos/i }))

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/describe tu idea/i)).toBeInTheDocument()
  })

  it("shows validation errors when submitting empty form", async () => {
    await navigateToFormStep()

    fireEvent.click(screen.getByRole("button", { name: /confirmar reserva/i }))

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
    })
  })

  it("calls POST /api/consultations with valid form data", async () => {
    await navigateToFormStep()

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { appointmentId: "apt-1", status: "CONFIRMED" } }),
    } as Response)

    await fillAndSubmitForm()

    await waitFor(() => {
      const calls = vi.mocked(global.fetch).mock.calls
      const consultationCall = calls.find((c) => String(c[0]).includes("/api/consultations"))
      expect(consultationCall).toBeDefined()
    })
  })

  it("shows confirmation view after successful submit", async () => {
    await navigateToFormStep()

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { appointmentId: "apt-1", status: "CONFIRMED" } }),
    } as Response)

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(screen.getByText(/reserva confirmada/i)).toBeInTheDocument()
    })
  })

  it("confirmation view shows the client name", async () => {
    await navigateToFormStep()

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { appointmentId: "apt-1", status: "CONFIRMED" } }),
    } as Response)

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(screen.getByText(/Ana García/)).toBeInTheDocument()
    })
  })

  it("confirmation view shows date and time of the appointment", async () => {
    await navigateToFormStep()

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { appointmentId: "apt-1", status: "CONFIRMED" } }),
    } as Response)

    await fillAndSubmitForm()

    await waitFor(() => {
      // Should show time formatted from the selected slot (10:00 UTC)
      expect(screen.getByText(/10:00/)).toBeInTheDocument()
    })
  })

  it("does not redirect to any external URL after successful submit", async () => {
    await navigateToFormStep()

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { appointmentId: "apt-1", status: "CONFIRMED" } }),
    } as Response)

    const originalLocation = window.location.href
    await fillAndSubmitForm()

    await waitFor(() => {
      expect(screen.getByText(/reserva confirmada/i)).toBeInTheDocument()
    })

    expect(window.location.href).toBe(originalLocation)
  })

  it("shows submitError when API returns an error", async () => {
    await navigateToFormStep()

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: "Slot no disponible" } }),
    } as Response)

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/slot no disponible/i)
    })
  })

  it("shows submitError when fetch throws", async () => {
    await navigateToFormStep()

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"))

    await fillAndSubmitForm()

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/network error/i)
    })
  })
})
