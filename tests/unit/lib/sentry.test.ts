import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock @sentry/nextjs before importing captureException
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import * as SentrySDK from "@sentry/nextjs"
import { captureException, captureMessage } from "@/lib/sentry"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("captureException", () => {
  it("no llama a Sentry.captureException fuera de producción", () => {
    captureException(new Error("test error"))
    expect(SentrySDK.captureException).not.toHaveBeenCalled()
  })

  it("loguea en consola fuera de producción", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    captureException(new Error("test error"))
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe("captureMessage", () => {
  it("no llama a Sentry.captureMessage fuera de producción", () => {
    captureMessage("test message")
    expect(SentrySDK.captureMessage).not.toHaveBeenCalled()
  })
})
