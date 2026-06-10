import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  AppointmentNotFoundError,
  LinkAlreadyUsedError,
  LinkExpiredError,
  LinkNotFoundError,
} from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findAppointmentById: vi.fn(),
    createSessionLink: vi.fn(),
    findSessionLinkByHash: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { sessionLinkService } from "@/modules/booking/services/session-link-service"

const mockFindAppointment = vi.mocked(bookingRepository.findAppointmentById)
const mockCreateSessionLink = vi.mocked(bookingRepository.createSessionLink)
const mockFindSessionLink = vi.mocked(bookingRepository.findSessionLinkByHash)
const mockAuditLog = vi.mocked(auditService.log)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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
  client: {
    id: "client-001",
    name: "Ana García",
    email: "ana@example.com",
    phone: "+34612345678",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
}

const validSessionLink = {
  id: "sl-001",
  appointmentId: "appt-001",
  tokenHash: "hash",
  expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días en el futuro
  usedAt: null,
  sessionDurationMinutes: 180,
  artistNotes: "Traer referencia",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const validInput = {
  appointmentId: "appt-001",
  sessionDurationMinutes: 180,
  artistNotes: "Traer referencia",
}

// ─── createSessionLink ────────────────────────────────────────────────────────

describe("sessionLinkService.createSessionLink", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindAppointment.mockResolvedValue(mockAppointment)
    mockCreateSessionLink.mockResolvedValue(validSessionLink)
    mockAuditLog.mockResolvedValue(undefined)
  })

  it("returns a raw token (64-char hex string)", async () => {
    const result = await sessionLinkService.createSessionLink(validInput)
    expect(result.token).toMatch(/^[0-9a-f]{64}$/)
  })

  it("sets expiresAt approximately 30 days in the future", async () => {
    const before = Date.now()
    const result = await sessionLinkService.createSessionLink(validInput)
    const after = Date.now()

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + thirtyDaysMs - 100)
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + thirtyDaysMs + 100)
  })

  it("stores the token hash (not the raw token) in DB", async () => {
    const result = await sessionLinkService.createSessionLink(validInput)

    expect(mockCreateSessionLink).toHaveBeenCalledOnce()
    const call = mockCreateSessionLink.mock.calls[0][0]
    expect(call.tokenHash).not.toBe(result.token)
    expect(call.tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it("logs SESSION_LINK_CREATED to audit service", async () => {
    await sessionLinkService.createSessionLink(validInput)
    expect(mockAuditLog).toHaveBeenCalledOnce()
    expect(mockAuditLog).toHaveBeenCalledWith(
      "SESSION_LINK_CREATED",
      "appt-001",
      expect.objectContaining({ entityType: "SessionLink" })
    )
  })

  it("throws AppointmentNotFoundError if appointment does not exist", async () => {
    mockFindAppointment.mockResolvedValue(null)
    await expect(sessionLinkService.createSessionLink(validInput)).rejects.toThrow(
      AppointmentNotFoundError
    )
    expect(mockCreateSessionLink).not.toHaveBeenCalled()
  })
})

// ─── validateSessionLink ──────────────────────────────────────────────────────

describe("sessionLinkService.validateSessionLink", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns session link data for a valid token", async () => {
    mockFindSessionLink.mockResolvedValue(validSessionLink)
    const result = await sessionLinkService.validateSessionLink("some-token")

    expect(result.sessionDurationMinutes).toBe(180)
    expect(result.artistNotes).toBe("Traer referencia")
    expect(result.expiresAt).toEqual(validSessionLink.expiresAt)
  })

  it("throws LinkNotFoundError when token hash is not in DB", async () => {
    mockFindSessionLink.mockResolvedValue(null)
    await expect(sessionLinkService.validateSessionLink("nonexistent")).rejects.toThrow(
      LinkNotFoundError
    )
  })

  it("throws LinkExpiredError when expiresAt is in the past", async () => {
    mockFindSessionLink.mockResolvedValue({
      ...validSessionLink,
      expiresAt: new Date(Date.now() - 1000),
    })
    await expect(sessionLinkService.validateSessionLink("expired-token")).rejects.toThrow(
      LinkExpiredError
    )
  })

  it("throws LinkAlreadyUsedError when usedAt is set", async () => {
    mockFindSessionLink.mockResolvedValue({
      ...validSessionLink,
      usedAt: new Date(Date.now() - 5000),
    })
    await expect(sessionLinkService.validateSessionLink("used-token")).rejects.toThrow(
      LinkAlreadyUsedError
    )
  })
})
