import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import { ConsultationConfirmedEmail } from "@/modules/notification/templates/consultation-confirmed"
import type { ConsultationConfirmedPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payload: ConsultationConfirmedPayload = {
  clientName: "Ana García",
  clientEmail: "ana@test.com",
  appointmentDate: "Lunes 15 de junio de 2026",
  appointmentTime: "11:00",
  depositAmount: 50,
  magicLinkUrl: "https://estudio.com/magic-link/abc123",
}

async function renderTemplate(props: ConsultationConfirmedPayload): Promise<string> {
  return render(createElement(ConsultationConfirmedEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ConsultationConfirmedEmail", () => {
  it("contiene el nombre del cliente", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Ana García")
  })

  it("contiene la fecha de la cita", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Lunes 15 de junio de 2026")
  })

  it("contiene la hora de la cita", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("11:00")
  })

  it("contiene el importe del depósito formateado", async () => {
    const html = await renderTemplate(payload)
    // Formato EUR: 50,00 € o 50 € según locale
    expect(html).toMatch(/50/)
  })

  it("el botón CTA incluye el magicLinkUrl", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("https://estudio.com/magic-link/abc123")
  })

  it("el texto de preview contiene la fecha y hora", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Lunes 15 de junio de 2026")
    expect(html).toContain("11:00")
  })
})
