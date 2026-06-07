import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"
import { middleware } from "@/middleware"

// Mock getSessionCookie para controlar la presencia de sesión
vi.mock("better-auth/cookies", () => ({
  getSessionCookie: vi.fn(),
}))

import { getSessionCookie } from "better-auth/cookies"
const mockGetSessionCookie = vi.mocked(getSessionCookie)

function makeRequest(pathname: string, options?: { cookies?: Record<string, string> }) {
  const url = `http://localhost:3000${pathname}`
  const request = new NextRequest(url)
  if (options?.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      request.cookies.set(name, value)
    }
  }
  return request
}

describe("Admin middleware protection", () => {
  it("redirige a /admin/login si no hay sesión", async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const request = makeRequest("/admin")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/admin/login")
  })

  it("redirige a /admin/login en subrutas sin sesión", async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const request = makeRequest("/admin/appointments")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/admin/login")
  })

  it("permite acceso a /admin/login sin sesión", async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const request = makeRequest("/admin/login")
    const response = await middleware(request)

    // NextResponse.next() no tiene status de redirect
    expect(response.headers.get("location")).toBeNull()
  })

  it("redirige de /admin/login a /admin si ya hay sesión activa", async () => {
    mockGetSessionCookie.mockReturnValue("session-token-value")

    const request = makeRequest("/admin/login")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/admin")
    expect(response.headers.get("location")).not.toContain("/admin/login")
  })

  it("permite acceso a /admin con sesión activa", async () => {
    mockGetSessionCookie.mockReturnValue("session-token-value")

    const request = makeRequest("/admin")
    const response = await middleware(request)

    expect(response.headers.get("location")).toBeNull()
  })
})
