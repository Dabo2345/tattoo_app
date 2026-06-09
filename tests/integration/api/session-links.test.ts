import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import {
  LinkAlreadyUsedError,
  LinkExpiredError,
  LinkNotFoundError,
  SlotNotAvailableError,
} from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/services/session-link-service", () => ({
  sessionLinkService: {
    validateSessionLink: vi.fn(),
  },
}))

vi.mock("@/modules/booking/services/booking-service", () => ({
  bookingService: {
    bookTattooSession: vi.fn(),
  },
}))

import { sessionLinkService } from "@/modules/booking/services/session-link-service"
import { bookingService } from "@/modules/booking/services/booking-service"
import { GET } from "@/app/api/session-links/[token]/route"
import { POST } from "@/app/api/session-links/[token]/book/route"

const mockValidate = vi.mocked(sessionLinkService.validateSessionLink)
const mockBook = vi.mocked(bookingService.bookTattooSession)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validLinkData = {
  expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  sessionDurationMinutes: 180,
  artistNotes: "Traer referencia",
}

function makeGetRequest(token: string): [NextRequest, { params: Promise<Record<string, string>> }] {
  const req = new NextRequest(`http://localhost/api/session-links/${token}`)
  const ctx = { params: Promise.resolve({ token }) }
  return [req, ctx]
}

function makePostRequest(
  token: string,
  body: unknown
): [NextRequest, { params: Promise<Record<string, string>> }] {
  const req = new NextRequest(`http://localhost/api/session-links/${token}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const ctx = { params: Promise.resolve({ token }) }
  return [req, ctx]
}

// ─── GET /api/session-links/:token ───────────────────────────────────────────

describe("GET /api/session-links/:token", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 200 with valid link data for a valid token", async () => {
    mockValidate.mockResolvedValue(validLinkData)

    const [req, ctx] = makeGetRequest("valid-token")
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.valid).toBe(true)
    expect(body.data.durationMinutes).toBe(180)
  })

  it("returns 410 for expired token", async () => {
    mockValidate.mockRejectedValue(new LinkExpiredError())

    const [req, ctx] = makeGetRequest("expired-token")
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.error.code).toBe("LINK_EXPIRED")
  })

  it("returns 410 for already used token", async () => {
    mockValidate.mockRejectedValue(new LinkAlreadyUsedError())

    const [req, ctx] = makeGetRequest("used-token")
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.error.code).toBe("LINK_ALREADY_USED")
  })
})

// ─── POST /api/session-links/:token/book ─────────────────────────────────────

describe("POST /api/session-links/:token/book", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 201 with appointmentId on successful booking", async () => {
    mockBook.mockResolvedValue({ appointmentId: "appt-new-001" })

    const [req, ctx] = makePostRequest("valid-token", { startAt: "2026-09-01T10:00:00.000Z" })
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.appointmentId).toBe("appt-new-001")
    expect(mockBook).toHaveBeenCalledWith("valid-token", new Date("2026-09-01T10:00:00.000Z"))
  })

  it("returns 410 when token is invalid or expired", async () => {
    mockBook.mockRejectedValue(new LinkNotFoundError())

    const [req, ctx] = makePostRequest("bad-token", { startAt: "2026-09-01T10:00:00.000Z" })
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.error.code).toBe("LINK_EXPIRED")
  })

  it("returns 409 when slot is not available", async () => {
    mockBook.mockRejectedValue(new SlotNotAvailableError())

    const [req, ctx] = makePostRequest("valid-token", { startAt: "2026-09-01T10:00:00.000Z" })
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
  })

  it("returns 400 when startAt is missing", async () => {
    const [req, ctx] = makePostRequest("valid-token", {})
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("returns 400 when startAt is not a valid ISO date", async () => {
    const [req, ctx] = makePostRequest("valid-token", { startAt: "not-a-date" })
    const res = await POST(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })
})
