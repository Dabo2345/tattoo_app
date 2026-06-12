import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import { AppointmentRescheduledEmail } from "@/modules/notification/templates/appointment-rescheduled"
import type { AppointmentRescheduledPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payload: AppointmentRescheduledPayload = {
  clientName: "Ana García",
  clientEmail: "ana@test.com",
  oldDate: "Lunes 15 de junio de 2026",
  newDate: "Miércoles 17 de junio de 2026",
  newTime: "12:00",
  magicLinkUrl: "https://estudio.com/magic-link/abc123",
}

async function renderTemplate(props: AppointmentRescheduledPayload): Promise<string> {
  return render(createElement(AppointmentRescheduledEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AppointmentRescheduledEmail", () => {
  it("contiene el nombre del cliente", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Ana García")
  })

  it("contiene la fecha anterior", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Lunes 15 de junio de 2026")
  })

  it("contiene la nueva fecha", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Miércoles 17 de junio de 2026")
  })

  it("contiene la nueva hora", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("12:00")
  })

  it("el botón CTA incluye el magicLinkUrl", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("https://estudio.com/magic-link/abc123")
  })

  it("el texto de preview contiene la nueva fecha y hora", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Miércoles 17 de junio de 2026")
    expect(html).toContain("12:00")
  })
})
