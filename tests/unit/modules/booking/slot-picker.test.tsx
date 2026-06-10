// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SlotPicker } from "@/modules/booking/components/slot-picker"

// ─── Mock bookingApi ──────────────────────────────────────────────────────────

vi.mock("@/modules/booking/api/booking-api", () => ({
  bookingApi: {
    getAvailability: vi.fn(),
  },
}))

import { bookingApi } from "@/modules/booking/api/booking-api"
const mockGetAvailability = vi.mocked(bookingApi.getAvailability)

// ─── Test helpers ─────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const testDate = new Date("2026-08-10T00:00:00.000Z")

const mockSlots = [
  { startsAt: "2026-08-10T10:00:00.000Z", endsAt: "2026-08-10T10:30:00.000Z" },
  { startsAt: "2026-08-10T10:30:00.000Z", endsAt: "2026-08-10T11:00:00.000Z" },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SlotPicker", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows loading skeleton while fetching", () => {
    mockGetAvailability.mockReturnValue(new Promise(() => {})) // never resolves
    render(<SlotPicker date={testDate} onSlotSelect={vi.fn()} />, { wrapper })
    expect(screen.getByLabelText("Cargando slots")).toBeInTheDocument()
  })

  it("renders available slots when query resolves", async () => {
    mockGetAvailability.mockResolvedValue(mockSlots)
    render(<SlotPicker date={testDate} onSlotSelect={vi.fn()} />, { wrapper })
    expect(await screen.findByText("10:00")).toBeInTheDocument()
    expect(screen.getByText("10:30")).toBeInTheDocument()
  })

  it("calls onSlotSelect when a slot is clicked", async () => {
    const onSlotSelect = vi.fn()
    mockGetAvailability.mockResolvedValue(mockSlots)
    render(<SlotPicker date={testDate} onSlotSelect={onSlotSelect} />, { wrapper })
    fireEvent.click(await screen.findByText("10:00"))
    expect(onSlotSelect).toHaveBeenCalledWith(mockSlots[0])
  })

  it("shows no-slots message when array is empty", async () => {
    mockGetAvailability.mockResolvedValue([])
    render(<SlotPicker date={testDate} onSlotSelect={vi.fn()} />, { wrapper })
    expect(await screen.findByText(/no hay slots disponibles/i)).toBeInTheDocument()
  })

  it("shows error message when fetch fails", async () => {
    mockGetAvailability.mockRejectedValue(new Error("Network error"))
    render(<SlotPicker date={testDate} onSlotSelect={vi.fn()} />, { wrapper })
    expect(await screen.findByText(/no se pudo cargar/i)).toBeInTheDocument()
  })
})
