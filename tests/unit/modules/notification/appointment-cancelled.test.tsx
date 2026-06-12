import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import { AppointmentCancelledEmail } from "@/modules/notification/templates/appointment-cancelled"
import type { AppointmentCancelledPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payloadWithRefund: AppointmentCancelledPayload = {
  clientName: "Ana García",
  clientEmail: "ana@test.com",
  appointmentDate: "Lunes 15 de junio de 2026",
  refundAmount: 50,
  refundDays: 5,
}

const payloadNoRefund: AppointmentCancelledPayload = {
  clientName: "Carlos López",
  clientEmail: "carlos@test.com",
  appointmentDate: "Martes 16 de junio de 2026",
  refundAmount: 0,
  refundDays: 0,
}

async function renderTemplate(props: AppointmentCancelledPayload): Promise<string> {
  return render(createElement(AppointmentCancelledEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AppointmentCancelledEmail", () => {
  it("contiene el nombre del cliente", async () => {
    const html = await renderTemplate(payloadWithRefund)
    expect(html).toContain("Ana García")
  })

  it("contiene la fecha cancelada", async () => {
    const html = await renderTemplate(payloadWithRefund)
    expect(html).toContain("Lunes 15 de junio de 2026")
  })

  it("muestra el importe y plazo del reembolso cuando hay reembolso", async () => {
    const html = await renderTemplate(payloadWithRefund)
    expect(html).toContain("50")
    expect(html).toContain("5")
  })

  it("indica que no hay reembolso cuando refundAmount es 0", async () => {
    const html = await renderTemplate(payloadNoRefund)
    expect(html).toContain("no será reembolsado")
  })

  it("no muestra texto de reembolso cuando no hay reembolso", async () => {
    const html = await renderTemplate(payloadNoRefund)
    expect(html).not.toContain("días hábiles")
  })

  it("el texto de preview contiene la fecha", async () => {
    const html = await renderTemplate(payloadWithRefund)
    expect(html).toContain("Lunes 15 de junio de 2026")
  })

  it("contiene el nombre del cliente sin reembolso", async () => {
    const html = await renderTemplate(payloadNoRefund)
    expect(html).toContain("Carlos López")
  })
})
