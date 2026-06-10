import { describe, it, expect, vi, beforeEach } from "vitest"
import { AppointmentNotFoundError, LinkExpiredError, LinkNotFoundError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findAppointmentById: vi.fn(),
    createMagicLink: vi.fn(),
    findMagicLinkWithAppointment: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { magicLinkService } from "@/modules/booking/services/magic-link-service"

const mockFindAppointment = vi.mocked(bookingRepository.findAppointmentById)
const mockCreateMagicLink = vi.mocked(bookingRepository.createMagicLink)
const mockFindWithAppointment = vi.mocked(bookingRepository.findMagicLinkWithAppointment)
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

// ─── createMagicLink ──────────────────────────────────────────────────────────

describe("magicLinkService.createMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindAppointment.mockResolvedValue(mockAppointment)
    mockCreateMagicLink.mockResolvedValue({
      id: "ml-001",
      appointmentId: "appt-001",
      tokenHash: "hash",
      expiresAt: new Date(),
      purpose: "MANAGE_APPOINTMENT",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockAuditLog.mockResolvedValue(undefined)
  })

  it("returns a raw token (64-char hex string)", async () => {
    const result = await magicLinkService.createMagicLink("appt-001")
    expect(result.token).toMatch(/^[0-9a-f]{64}$/)
  })

  it("sets expiresAt approximately 2 hours in the future", async () => {
    const before = Date.now()
    const result = await magicLinkService.createMagicLink("appt-001")
    const after = Date.now()

    const twoHoursMs = 2 * 60 * 60 * 1000
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + twoHoursMs - 100)
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + twoHoursMs + 100)
  })

  it("stores the token hash (not the raw token) in DB", async () => {
    const result = await magicLinkService.createMagicLink("appt-001")

    expect(mockCreateMagicLink).toHaveBeenCalledOnce()
    const call = mockCreateMagicLink.mock.calls[0][0]
    expect(call.tokenHash).not.toBe(result.token)
    expect(call.tokenHash).toHaveLength(64)
    expect(call.tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it("logs MAGIC_LINK_CREATED to audit service", async () => {
    await magicLinkService.createMagicLink("appt-001")
    expect(mockAuditLog).toHaveBeenCalledOnce()
    expect(mockAuditLog).toHaveBeenCalledWith(
      "MAGIC_LINK_CREATED",
      "appt-001",
      expect.objectContaining({ entityType: "MagicLink" })
    )
  })

  it("throws AppointmentNotFoundError if appointment does not exist", async () => {
    mockFindAppointment.mockResolvedValue(null)
    await expect(magicLinkService.createMagicLink("non-existent")).rejects.toThrow(
      AppointmentNotFoundError
    )
    expect(mockCreateMagicLink).not.toHaveBeenCalled()
  })
})

// ─── validateMagicLink ────────────────────────────────────────────────────────

describe("magicLinkService.validateMagicLink", () => {
  const validMagicLink = {
    id: "ml-001",
    appointmentId: "appt-001",
    tokenHash: "hash",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora en el futuro
    purpose: "MANAGE_APPOINTMENT" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    appointment: mockAppointment,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns appointment with client when token is valid", async () => {
    mockFindWithAppointment.mockResolvedValue(validMagicLink)
    const result = await magicLinkService.validateMagicLink("some-token")

    expect(result.appointment.id).toBe("appt-001")
    expect(result.appointment.client.email).toBe("ana@example.com")
  })

  it("throws LinkNotFoundError when token hash is not in DB", async () => {
    mockFindWithAppointment.mockResolvedValue(null)
    await expect(magicLinkService.validateMagicLink("non-existent-token")).rejects.toThrow(
      LinkNotFoundError
    )
  })

  it("throws LinkExpiredError when expiresAt is in the past", async () => {
    mockFindWithAppointment.mockResolvedValue({
      ...validMagicLink,
      expiresAt: new Date(Date.now() - 1000), // expirado hace 1 segundo
    })
    await expect(magicLinkService.validateMagicLink("expired-token")).rejects.toThrow(
      LinkExpiredError
    )
  })
})
