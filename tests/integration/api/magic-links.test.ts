import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { LinkExpiredError, LinkNotFoundError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/repositories/client-repository", () => ({
  clientRepository: {
    findByEmail: vi.fn(),
  },
}))

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findLatestConfirmedAppointmentByClientId: vi.fn(),
  },
}))

vi.mock("@/modules/booking/services/magic-link-service", () => ({
  magicLinkService: {
    createMagicLink: vi.fn(),
    validateMagicLink: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendMagicLink: vi.fn(),
  },
}))

import { clientRepository } from "@/modules/booking/repositories/client-repository"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { magicLinkService } from "@/modules/booking/services/magic-link-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import { POST } from "@/app/api/magic-links/request/route"
import { GET } from "@/app/api/magic-links/[token]/route"

const mockFindByEmail = vi.mocked(clientRepository.findByEmail)
const mockFindLatestAppointment = vi.mocked(
  bookingRepository.findLatestConfirmedAppointmentByClientId
)
const mockCreateMagicLink = vi.mocked(magicLinkService.createMagicLink)
const mockValidateMagicLink = vi.mocked(magicLinkService.validateMagicLink)
const mockSendMagicLink = vi.mocked(notificationService.sendMagicLink)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockClient = {
  id: "client-001",
  name: "Ana García",
  email: "ana@example.com",
  phone: "+34612345678",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const mockAppointment = {
  id: "appt-001",
  clientId: "client-001",
  type: "CONSULTATION" as const,
  status: "CONFIRMED" as const,
  startsAt: new Date("2026-08-01T10:00:00Z"),
  endsAt: new Date("2026-08-01T11:00:00Z"),
  notes: null,
  depositRequired: true,
  depositAmount: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const mockValidateResult = {
  appointment: {
    id: "appt-001",
    type: "CONSULTATION",
    status: "CONFIRMED",
    startsAt: new Date("2026-08-01T10:00:00Z"),
    endsAt: new Date("2026-08-01T11:00:00Z"),
    notes: null,
    client: {
      id: "client-001",
      name: "Ana García",
      email: "ana@example.com",
      phone: "+34612345678",
    },
  },
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/magic-links/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(token: string): [NextRequest, { params: Promise<Record<string, string>> }] {
  const req = new NextRequest(`http://localhost/api/magic-links/${token}`)
  const ctx = { params: Promise.resolve({ token }) }
  return [req, ctx]
}

// ─── POST /api/magic-links/request ───────────────────────────────────────────

describe("POST /api/magic-links/request", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateMagicLink.mockResolvedValue({
      token: "a".repeat(64),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    })
    mockSendMagicLink.mockResolvedValue(undefined)
  })

  it("returns 200 { requested: true } when MagicLink is created successfully", async () => {
    mockFindByEmail.mockResolvedValue(mockClient)
    mockFindLatestAppointment.mockResolvedValue(mockAppointment)

    const res = await POST(makePostRequest({ email: "ana@example.com" }), {
      params: Promise.resolve({}),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.requested).toBe(true)
    expect(mockCreateMagicLink).toHaveBeenCalledWith("appt-001")
  })

  it("returns 200 { requested: true } when email is not registered", async () => {
    mockFindByEmail.mockResolvedValue(null)

    const res = await POST(makePostRequest({ email: "unknown@example.com" }), {
      params: Promise.resolve({}),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockCreateMagicLink).not.toHaveBeenCalled()
  })

  it("returns 200 { requested: true } when client has no CONFIRMED appointment", async () => {
    mockFindByEmail.mockResolvedValue(mockClient)
    mockFindLatestAppointment.mockResolvedValue(null)

    const res = await POST(makePostRequest({ email: "ana@example.com" }), {
      params: Promise.resolve({}),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockCreateMagicLink).not.toHaveBeenCalled()
  })

  it("returns 400 VALIDATION_ERROR when email is missing", async () => {
    const res = await POST(makePostRequest({}), { params: Promise.resolve({}) })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("calls notificationService.sendMagicLink after creating the link", async () => {
    mockFindByEmail.mockResolvedValue(mockClient)
    mockFindLatestAppointment.mockResolvedValue(mockAppointment)

    await POST(makePostRequest({ email: "ana@example.com" }), { params: Promise.resolve({}) })

    expect(mockSendMagicLink).toHaveBeenCalledWith("appt-001", "a".repeat(64))
  })
})

// ─── GET /api/magic-links/:token ─────────────────────────────────────────────

describe("GET /api/magic-links/:token", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 with appointment data for a valid token", async () => {
    mockValidateMagicLink.mockResolvedValue(mockValidateResult)

    const [req, ctx] = makeGetRequest("valid-token-abc")
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.appointment.id).toBe("appt-001")
    expect(body.data.appointment.client.email).toBe("ana@example.com")
  })

  it("returns 410 LINK_EXPIRED when token is expired", async () => {
    mockValidateMagicLink.mockRejectedValue(new LinkExpiredError())

    const [req, ctx] = makeGetRequest("expired-token")
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("LINK_EXPIRED")
  })

  it("returns 410 LINK_EXPIRED when token does not exist", async () => {
    mockValidateMagicLink.mockRejectedValue(new LinkNotFoundError())

    const [req, ctx] = makeGetRequest("nonexistent-token")
    const res = await GET(req, ctx)
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("LINK_EXPIRED")
  })
})
