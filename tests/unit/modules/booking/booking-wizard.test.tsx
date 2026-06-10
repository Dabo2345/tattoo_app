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
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockSlots }),
    } as Response)

    render(<BookingWizard />)

    // Navigate to form step
    fireEvent.change(screen.getByLabelText(/fecha de la consulta/i), {
      target: { value: "2026-08-10" },
    })
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }))
    fireEvent.click(await screen.findByText("10:00"))
    fireEvent.click(screen.getByRole("button", { name: /siguiente.*datos/i }))

    // Submit empty form
    fireEvent.click(screen.getByRole("button", { name: /ir al pago/i }))

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
    })
  })

  it("calls POST /api/consultations with valid form data", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSlots }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { appointmentId: "apt-1", stripeCheckoutUrl: "https://stripe.com/pay/xxx" },
        }),
      } as Response)

    // Mock window.location
    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
    } as Location)
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    })

    render(<BookingWizard />)

    fireEvent.change(screen.getByLabelText(/fecha de la consulta/i), {
      target: { value: "2026-08-10" },
    })
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }))
    fireEvent.click(await screen.findByText("10:00"))
    fireEvent.click(screen.getByRole("button", { name: /siguiente.*datos/i }))

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

    fireEvent.click(screen.getByRole("button", { name: /ir al pago/i }))

    await waitFor(() => {
      const calls = vi.mocked(global.fetch).mock.calls
      const consultationCall = calls.find((c) => String(c[0]).includes("/api/consultations"))
      expect(consultationCall).toBeDefined()
    })

    locationSpy.mockRestore()
  })
})
