import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import { Reminder2hEmail } from "@/modules/notification/templates/reminder-2h"
import type { ReminderPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payload: ReminderPayload = {
  clientName: "Carlos López",
  clientEmail: "carlos@test.com",
  appointmentDate: "Martes 16 de junio de 2026",
  appointmentTime: "15:30",
  hoursUntil: 2,
}

async function renderTemplate(props: ReminderPayload): Promise<string> {
  return render(createElement(Reminder2hEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Reminder2hEmail", () => {
  it("contiene el nombre del cliente", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Carlos López")
  })

  it("contiene la hora de la cita", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("15:30")
  })

  it("contiene la fecha de la cita", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Martes 16 de junio de 2026")
  })

  it("el texto de preview menciona 2 horas", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("2 horas")
  })

  it("incluye mensaje de puntualidad", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("puntual")
  })
})
