import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import {
  SessionConfirmedEmail,
  formatDuration,
} from "@/modules/notification/templates/session-confirmed"
import type { SessionConfirmedPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payload: SessionConfirmedPayload = {
  clientName: "Carlos López",
  clientEmail: "carlos@test.com",
  appointmentDate: "Viernes 20 de junio de 2026",
  appointmentTime: "15:30",
  durationMinutes: 90,
}

async function renderTemplate(props: SessionConfirmedPayload): Promise<string> {
  return render(createElement(SessionConfirmedEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("formatDuration", () => {
  it("formatea minutos menores a 60", () => {
    expect(formatDuration(30)).toBe("30 min")
  })

  it("formatea horas exactas", () => {
    expect(formatDuration(60)).toBe("1h")
    expect(formatDuration(120)).toBe("2h")
  })

  it("formatea horas y minutos combinados", () => {
    expect(formatDuration(90)).toBe("1h 30min")
    expect(formatDuration(150)).toBe("2h 30min")
  })
})

describe("SessionConfirmedEmail", () => {
  it("contiene el nombre del cliente", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Carlos López")
  })

  it("contiene la fecha de la sesión", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Viernes 20 de junio de 2026")
  })

  it("contiene la hora de la sesión", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("15:30")
  })

  it("contiene la duración formateada", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("1h 30min")
  })

  it("no muestra sección de notas si artistNotes es undefined", async () => {
    const html = await renderTemplate(payload)
    expect(html).not.toContain("Notas del artista")
  })

  it("muestra la sección de notas si artistNotes está presente", async () => {
    const withNotes: SessionConfirmedPayload = {
      ...payload,
      artistNotes: "Llevar ropa cómoda y no consumir alcohol 24h antes.",
    }
    const html = await renderTemplate(withNotes)
    expect(html).toContain("Notas del artista")
    expect(html).toContain("Llevar ropa cómoda y no consumir alcohol 24h antes.")
  })
})
