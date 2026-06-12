import { describe, it, expect } from "vitest"
import { render } from "@react-email/render"
import { createElement } from "react"
import { MagicLinkEmail } from "@/modules/notification/templates/magic-link"
import type { MagicLinkSentPayload } from "@/modules/notification/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const payload: MagicLinkSentPayload = {
  clientName: "Ana García",
  clientEmail: "ana@test.com",
  magicLinkUrl: "https://estudio.com/magic-link/tok123",
  expiresInHours: 2,
}

async function renderTemplate(props: MagicLinkSentPayload): Promise<string> {
  return render(createElement(MagicLinkEmail, props))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MagicLinkEmail", () => {
  it("contiene el nombre del cliente", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("Ana García")
  })

  it("el botón CTA incluye el magicLinkUrl", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("https://estudio.com/magic-link/tok123")
  })

  it("muestra las horas de expiración", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("2")
  })

  it("el texto de preview menciona la duración", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("2h")
  })

  it("incluye advertencia de enlace de un solo uso", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("un solo uso")
  })

  it("incluye instrucciones de qué se puede hacer con el enlace", async () => {
    const html = await renderTemplate(payload)
    expect(html).toContain("reprogramarla")
  })
})
