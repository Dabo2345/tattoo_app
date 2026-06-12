import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import { SessionLinkEmail } from "@/modules/notification/templates/session-link"
import type { SessionLinkSentPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payloadWithNotes: SessionLinkSentPayload = {
  clientName: "Ana García",
  clientEmail: "ana@test.com",
  sessionLinkUrl: "https://estudio.com/session-link/tok456",
  expiresInHours: 720,
  artistNotes: "Trae referencia de diseño. Sesión de 4 horas estimadas.",
}

const payloadNoNotes: SessionLinkSentPayload = {
  clientName: "Carlos López",
  clientEmail: "carlos@test.com",
  sessionLinkUrl: "https://estudio.com/session-link/tok789",
  expiresInHours: 720,
}

async function renderTemplate(props: SessionLinkSentPayload): Promise<string> {
  return render(createElement(SessionLinkEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SessionLinkEmail", () => {
  it("contiene el nombre del cliente", async () => {
    const html = await renderTemplate(payloadWithNotes)
    expect(html).toContain("Ana García")
  })

  it("el botón CTA incluye el sessionLinkUrl", async () => {
    const html = await renderTemplate(payloadWithNotes)
    expect(html).toContain("https://estudio.com/session-link/tok456")
  })

  it("muestra la expiración en días (720h = 30 días)", async () => {
    const html = await renderTemplate(payloadWithNotes)
    expect(html).toContain("30")
  })

  it("muestra las notas del artista cuando existen", async () => {
    const html = await renderTemplate(payloadWithNotes)
    expect(html).toContain("Trae referencia de diseño")
  })

  it("no muestra sección de notas cuando artistNotes es undefined", async () => {
    const html = await renderTemplate(payloadNoNotes)
    expect(html).not.toContain("Notas del artista")
  })

  it("el texto de preview menciona los días de validez", async () => {
    const html = await renderTemplate(payloadWithNotes)
    expect(html).toContain("30 días")
  })

  it("contiene el nombre del cliente sin notas", async () => {
    const html = await renderTemplate(payloadNoNotes)
    expect(html).toContain("Carlos López")
  })
})
