// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CalendarPublic } from "@/modules/booking/components/calendar-public"

const TODAY = new Date(2026, 7, 1) // August 2026 — fixed for deterministic tests

function renderCalendar(props: Partial<React.ComponentProps<typeof CalendarPublic>> = {}) {
  return render(
    <CalendarPublic availableDates={[]} onDateSelect={vi.fn()} initialMonth={TODAY} {...props} />
  )
}

describe("CalendarPublic", () => {
  it("renders 7 weekday header labels", () => {
    renderCalendar()
    const headers = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    headers.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  it("renders the current month label", () => {
    renderCalendar()
    expect(screen.getByText(/agosto de 2026/i)).toBeInTheDocument()
  })

  it("marks available days as interactive (enabled buttons)", () => {
    renderCalendar({ availableDates: ["2026-08-10", "2026-08-15"] })
    const btn10 = screen.getByRole("button", { name: /^10 agosto/i })
    const btn15 = screen.getByRole("button", { name: /^15 agosto/i })
    expect(btn10).not.toBeDisabled()
    expect(btn15).not.toBeDisabled()
  })

  it("marks unavailable days as disabled", () => {
    renderCalendar({ availableDates: [] })
    const btn5 = screen.getByRole("button", { name: /^5 agosto.*no disponible/i })
    expect(btn5).toBeDisabled()
  })

  it("calls onDateSelect when available day is clicked", () => {
    const onDateSelect = vi.fn()
    renderCalendar({ availableDates: ["2026-08-10"], onDateSelect })
    fireEvent.click(screen.getByRole("button", { name: /^10 agosto/i }))
    expect(onDateSelect).toHaveBeenCalledOnce()
    expect(onDateSelect.mock.calls[0][0]).toBeInstanceOf(Date)
  })

  it("does not call onDateSelect when unavailable day is clicked", () => {
    const onDateSelect = vi.fn()
    renderCalendar({ availableDates: [], onDateSelect })
    fireEvent.click(screen.getByRole("button", { name: /^5 agosto.*no disponible/i }))
    expect(onDateSelect).not.toHaveBeenCalled()
  })

  it("navigates to previous month", () => {
    renderCalendar()
    fireEvent.click(screen.getByLabelText("Mes anterior"))
    expect(screen.getByText(/julio de 2026/i)).toBeInTheDocument()
  })

  it("navigates to next month", () => {
    renderCalendar()
    fireEvent.click(screen.getByLabelText("Mes siguiente"))
    expect(screen.getByText(/septiembre de 2026/i)).toBeInTheDocument()
  })
})
