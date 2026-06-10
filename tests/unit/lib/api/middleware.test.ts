import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { z } from "zod"

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

vi.mock("@/lib/sentry", () => ({
  captureException: vi.fn(),
}))

import { withErrorHandler, withAdminAuth } from "@/lib/api/middleware"
import { createApiResponse, createApiError } from "@/lib/api/response"
import { SlotNotAvailableError, DomainError } from "@/lib/api/errors"
import { auth } from "@/lib/auth"

const mockGetSession = vi.mocked(auth.api.getSession)

function makeRequest() {
  return new NextRequest("http://localhost:3000/api/test")
}

const emptyCtx = { params: Promise.resolve({}) }

// ─── createApiResponse ────────────────────────────────────────────────────────

describe("createApiResponse", () => {
  it("devuelve { success: true, data } con status 200", async () => {
    const response = createApiResponse({ id: "1" })
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, data: { id: "1" } })
  })

  it("devuelve status personalizado cuando se especifica", async () => {
    const response = createApiResponse({ id: "1" }, 201)
    expect(response.status).toBe(201)
  })
})

// ─── createApiError ───────────────────────────────────────────────────────────

describe("createApiError", () => {
  it("devuelve { success: false, error: { code, message } }", async () => {
    const response = createApiError("NOT_FOUND", "No encontrado", 404)
    const body = await response.json()
    expect(response.status).toBe(404)
    expect(body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "No encontrado" },
    })
  })
})

// ─── withErrorHandler ─────────────────────────────────────────────────────────

describe("withErrorHandler", () => {
  it("captura ZodError y devuelve 400 VALIDATION_ERROR", async () => {
    const zodError = (() => {
      const result = z.object({ name: z.string() }).safeParse({ name: 123 })
      if (!result.success) return result.error
      throw new Error("unexpected success")
    })()

    const handler = vi.fn().mockRejectedValue(zodError)
    const wrapped = withErrorHandler(handler)
    const response = await wrapped(makeRequest(), emptyCtx)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("captura DomainError y devuelve el status correcto", async () => {
    const handler = vi.fn().mockRejectedValue(new SlotNotAvailableError())
    const wrapped = withErrorHandler(handler)
    const response = await wrapped(makeRequest(), emptyCtx)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
    expect(body.error.message).toBe("El horario seleccionado ya no está disponible")
  })

  it("captura DomainError 5xx y reporta a Sentry", async () => {
    const { captureException } = await import("@/lib/sentry")
    const error5xx = new DomainError("INTERNAL_ERROR", "DB fail", 500)

    const handler = vi.fn().mockRejectedValue(error5xx)
    const wrapped = withErrorHandler(handler)
    await wrapped(makeRequest(), emptyCtx)

    expect(captureException).toHaveBeenCalledWith(error5xx)
  })

  it("captura errores desconocidos y devuelve 500 INTERNAL_ERROR", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("DB connection lost"))
    const wrapped = withErrorHandler(handler)
    const response = await wrapped(makeRequest(), emptyCtx)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe("INTERNAL_ERROR")
  })

  it("no expone detalles internos en errores 500", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("postgres secret dsn leaked"))
    const wrapped = withErrorHandler(handler)
    const response = await wrapped(makeRequest(), emptyCtx)
    const body = await response.json()

    expect(body.error.message).toBe("Error interno del servidor")
    expect(JSON.stringify(body)).not.toContain("postgres secret dsn leaked")
  })
})

// ─── withAdminAuth ────────────────────────────────────────────────────────────

describe("withAdminAuth", () => {
  beforeEach(() => vi.clearAllMocks())

  it("devuelve 401 UNAUTHORIZED si no hay sesión", async () => {
    mockGetSession.mockResolvedValue(null)
    const handler = vi.fn()
    const wrapped = withAdminAuth(handler)
    const response = await wrapped(makeRequest(), emptyCtx)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe("UNAUTHORIZED")
    expect(handler).not.toHaveBeenCalled()
  })

  it("ejecuta el handler con la sesión si está autenticado", async () => {
    const fakeSession = {
      session: {
        id: "s1",
        userId: "u1",
        token: "tok",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: "u1",
        email: "admin@test.com",
        name: "Admin",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      },
    }
    mockGetSession.mockResolvedValue(fakeSession)

    const handler = vi.fn().mockResolvedValue(createApiResponse({ ok: true }))
    const wrapped = withAdminAuth(handler)
    const response = await wrapped(makeRequest(), emptyCtx)

    expect(handler).toHaveBeenCalledWith(expect.any(NextRequest), emptyCtx, fakeSession)
    expect(response.status).toBe(200)
  })
})
