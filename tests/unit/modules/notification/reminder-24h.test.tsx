import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import { Reminder24hEmail } from "@/modules/notification/templates/reminder-24h"
import type { ReminderPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payload: ReminderPayload = {
  clientName: "Ana García",
  clientEmail: "ana@test.com",
  appointmentDate: "Lunes 15 de junio de 2026",
  appointmentTime: "10:00",
  hoursUntil: 24,
}

async function renderTemplate(props: ReminderPayload): Promise<string> {
  return render(createElement(Reminder24hEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Reminder24hEmail", () => {
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
    expect(html).toContain("10:00")
  })

  it("el texto de preview menciona mañana", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("mañana")
  })

  it("incluye consejos de preparación", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("hidrátate")
  })
})
