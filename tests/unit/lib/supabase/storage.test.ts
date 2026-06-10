import { describe, it, expect, vi } from "vitest"

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ storage: {} })),
}))
vi.mock("@/lib/env", () => ({
  env: { SUPABASE_URL: "http://localhost", SUPABASE_SERVICE_ROLE_KEY: "key" },
}))

import { validateImageFile } from "@/lib/supabase/storage"

const MB = 1024 * 1024

describe("validateImageFile", () => {
  it("rechaza archivos mayores de 10MB", () => {
    const result = validateImageFile("image/jpeg", 11 * MB)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("10MB")
    }
  })

  it("rechaza formatos distintos a JPEG y WebP", () => {
    const result = validateImageFile("image/png", 100)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain("JPEG")
    }
  })

  it("rechaza GIF aunque sea pequeño", () => {
    const result = validateImageFile("image/gif", 100)
    expect(result.valid).toBe(false)
  })

  it("acepta JPEG dentro del límite de tamaño", () => {
    const result = validateImageFile("image/jpeg", 100)
    expect(result.valid).toBe(true)
  })

  it("acepta WebP dentro del límite de tamaño", () => {
    const result = validateImageFile("image/webp", 100)
    expect(result.valid).toBe(true)
  })

  it("rechaza un JPEG de exactamente 10MB + 1 byte", () => {
    const result = validateImageFile("image/jpeg", 10 * MB + 1)
    expect(result.valid).toBe(false)
  })

  it("acepta un JPEG de exactamente 10MB", () => {
    const result = validateImageFile("image/jpeg", 10 * MB)
    expect(result.valid).toBe(true)
  })
})
