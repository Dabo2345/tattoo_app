import { describe, it, expect } from "vitest"
import { generateSecureToken, hashToken } from "@/lib/utils/tokens"

const HEX_REGEX = /^[0-9a-f]+$/

describe("generateSecureToken", () => {
  it("returns a 64-character string", () => {
    const token = generateSecureToken()
    expect(token).toHaveLength(64)
  })

  it("returns only lowercase hex characters", () => {
    const token = generateSecureToken()
    expect(HEX_REGEX.test(token)).toBe(true)
  })

  it("produces unique tokens on successive calls", () => {
    const tokens = new Set(Array.from({ length: 10 }, generateSecureToken))
    expect(tokens.size).toBe(10)
  })
})

describe("hashToken", () => {
  it("returns a 64-character string", () => {
    const hash = hashToken("abc")
    expect(hash).toHaveLength(64)
  })

  it("returns only lowercase hex characters", () => {
    const hash = hashToken("abc")
    expect(HEX_REGEX.test(hash)).toBe(true)
  })

  it("is deterministic: same input produces same output", () => {
    const token = generateSecureToken()
    expect(hashToken(token)).toBe(hashToken(token))
  })

  it("produces different hashes for different inputs", () => {
    const a = generateSecureToken()
    const b = generateSecureToken()
    expect(hashToken(a)).not.toBe(hashToken(b))
  })

  it("hash is not equal to the original token", () => {
    const token = generateSecureToken()
    expect(hashToken(token)).not.toBe(token)
  })
})
