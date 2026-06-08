import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/client", () => ({ supabaseAdmin: {} }))

import { validateImageFile } from "@/lib/supabase/storage"

describe("validateImageFile", () => {
  it("rechaza archivos mayores de 10MB", () => {
    const file = new File(["x".repeat(11 * 1024 * 1024)], "test.jpg", { type: "image/jpeg" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("10MB")
    }
  })

  it("rechaza formatos distintos a JPEG y WebP", () => {
    const file = new File(["content"], "test.png", { type: "image/png" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("JPEG")
    }
  })

  it("rechaza GIF aunque sea pequeño", () => {
    const file = new File(["content"], "test.gif", { type: "image/gif" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
  })

  it("acepta JPEG dentro del límite de tamaño", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it("acepta WebP dentro del límite de tamaño", () => {
    const file = new File(["content"], "test.webp", { type: "image/webp" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it("rechaza un JPEG de exactamente 10MB + 1 byte", () => {
    const file = new File(["x".repeat(10 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
  })

  it("acepta un JPEG de exactamente 10MB", () => {
    const file = new File(["x".repeat(10 * 1024 * 1024)], "max.jpg", { type: "image/jpeg" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })
})
