import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactElement } from "react"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/resend/client", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}))

vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "test@estudio.com",
    RESEND_FROM_NAME: "Estudio Test",
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { resend } from "@/lib/resend/client"
import { sendEmail } from "@/lib/resend/send-email"

const mockSend = vi.mocked(resend.emails.send)

const okResponse = { data: { id: "email-id-123" }, error: null, headers: null } as never
const errResponse = {
  data: null,
  error: { name: "validation_error", message: "Invalid email address", statusCode: 422 },
  headers: null,
} as never

const fakeEmail = {
  to: "cliente@test.com",
  subject: "Confirmación de cita",
  react: null as unknown as ReactElement,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("retorna { success: true } cuando Resend responde sin error", async () => {
    mockSend.mockResolvedValueOnce(okResponse)

    const result = await sendEmail(fakeEmail)

    expect(result.success).toBe(true)
  })

  it("llama a resend.emails.send con el remitente correcto", async () => {
    mockSend.mockResolvedValueOnce(okResponse)

    await sendEmail(fakeEmail)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Estudio Test <test@estudio.com>",
        to: "cliente@test.com",
        subject: "Confirmación de cita",
      })
    )
  })

  it("retorna { success: false, error } cuando Resend devuelve error", async () => {
    mockSend.mockResolvedValueOnce(errResponse)

    const result = await sendEmail(fakeEmail)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Invalid email address")
    }
  })

  it("retorna { success: false, error } cuando Resend lanza excepción", async () => {
    mockSend.mockRejectedValueOnce(new Error("Network timeout"))

    const result = await sendEmail(fakeEmail)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Network timeout")
    }
  })

  it("nunca lanza excepción aunque Resend falle (NP-003)", async () => {
    mockSend.mockRejectedValueOnce(new Error("Fatal error"))

    await expect(sendEmail(fakeEmail)).resolves.not.toThrow()
  })

  it("incluye el campo text si se proporciona", async () => {
    mockSend.mockResolvedValueOnce(okResponse)

    await sendEmail({ ...fakeEmail, text: "Versión texto plano" })

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ text: "Versión texto plano" }))
  })
})
