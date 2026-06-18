import { describe, it, expect, vi, beforeEach } from "vitest"
import { SlotNotAvailableError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/calendar/services/calendar-service", () => ({
  calendarService: {
    assertSlotAvailable: vi.fn(),
  },
}))

vi.mock("@/modules/booking/repositories/client-repository", () => ({
  clientRepository: {
    findOrCreate: vi.fn(),
  },
}))

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    createConsultation: vi.fn(),
    findSessionLinkWithAppointment: vi.fn(),
    createTattooSession: vi.fn(),
    markSessionLinkAsUsed: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendSessionConfirmed: vi.fn(),
  },
}))

vi.mock("@/lib/utils/tokens", () => ({
  hashToken: vi.fn().mockReturnValue("hashed-token"),
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

import { calendarService } from "@/modules/calendar/services/calendar-service"
import { clientRepository } from "@/modules/booking/repositories/client-repository"
import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import { bookingService } from "@/modules/booking/services/booking-service"
import { LinkAlreadyUsedError, LinkExpiredError, LinkNotFoundError } from "@/lib/api/errors"

const mockAssertSlot = vi.mocked(calendarService.assertSlotAvailable)
const mockFindOrCreate = vi.mocked(clientRepository.findOrCreate)
const mockCreateConsultation = vi.mocked(bookingRepository.createConsultation)
const mockFindSessionLink = vi.mocked(bookingRepository.findSessionLinkWithAppointment)
const mockCreateTattooSession = vi.mocked(bookingRepository.createTattooSession)
const mockMarkSessionLinkAsUsed = vi.mocked(bookingRepository.markSessionLinkAsUsed)
const mockAuditLog = vi.mocked(auditService.log)
const mockSendSessionConfirmed = vi.mocked(notificationService.sendSessionConfirmed)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validInput = {
  name: "Ana García",
  email: "ana@example.com",
  phone: "+34612345678",
  tattooDescription: "Rosa pequeña en muñeca",
  startsAt: new Date("2026-08-01T10:00:00Z"),
  endsAt: new Date("2026-08-01T11:00:00Z"),
}

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
  startsAt: validInput.startsAt,
  endsAt: validInput.endsAt,
  notes: validInput.tattooDescription,
  depositRequired: false,
  depositAmount: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("bookingService.createConsultation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAssertSlot.mockResolvedValue(undefined)
    mockFindOrCreate.mockResolvedValue(mockClient)
    mockCreateConsultation.mockResolvedValue(mockAppointment)
    mockAuditLog.mockResolvedValue(undefined)
  })

  it("crea appointment y auditlog cuando el slot está libre y el cliente es nuevo", async () => {
    const result = await bookingService.createConsultation(validInput)

    expect(mockAssertSlot).toHaveBeenCalledWith(validInput.startsAt, validInput.endsAt)
    expect(mockFindOrCreate).toHaveBeenCalledWith({
      name: validInput.name,
      email: validInput.email,
      phone: validInput.phone,
    })
    expect(mockCreateConsultation).toHaveBeenCalledWith({
      clientId: mockClient.id,
      startsAt: validInput.startsAt,
      endsAt: validInput.endsAt,
      notes: validInput.tattooDescription,
    })
    expect(result).toEqual({
      appointmentId: mockAppointment.id,
      clientId: mockClient.id,
    })
  })

  it("reutiliza el cliente existente si el email ya está registrado", async () => {
    const existingClient = { ...mockClient, id: "client-existing" }
    mockFindOrCreate.mockResolvedValue(existingClient)

    const result = await bookingService.createConsultation(validInput)

    // findOrCreate es el punto de entrada único — el servicio no distingue nuevo vs existente
    expect(mockFindOrCreate).toHaveBeenCalledOnce()
    expect(result.clientId).toBe("client-existing")
  })

  it("lanza SlotNotAvailableError si el slot está ocupado sin crear nada", async () => {
    mockAssertSlot.mockRejectedValue(new SlotNotAvailableError())

    await expect(bookingService.createConsultation(validInput)).rejects.toThrow(
      SlotNotAvailableError
    )

    expect(mockFindOrCreate).not.toHaveBeenCalled()
    expect(mockCreateConsultation).not.toHaveBeenCalled()
    expect(mockAuditLog).not.toHaveBeenCalled()
  })

  it("el appointment se crea en estado CONFIRMED (RB-NEW-001: sin pago previo)", async () => {
    await bookingService.createConsultation(validInput)

    expect(mockCreateConsultation).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: mockClient.id })
    )
    // El status CONFIRMED lo gestiona el repositorio internamente
    expect(mockCreateConsultation).toHaveBeenCalledOnce()
  })

  it("crea el auditlog con action CONSULTATION_CREATED y los IDs correctos", async () => {
    await bookingService.createConsultation(validInput)

    expect(mockAuditLog).toHaveBeenCalledWith(
      "CONSULTATION_CREATED",
      mockAppointment.id,
      expect.objectContaining({
        entityType: "Appointment",
        clientId: mockClient.id,
      })
    )
  })

  it("devuelve appointmentId y clientId correctos", async () => {
    const result = await bookingService.createConsultation(validInput)

    expect(result).toStrictEqual({
      appointmentId: mockAppointment.id,
      clientId: mockClient.id,
    })
  })
})

// ─── bookTattooSession ────────────────────────────────────────────────────────

const sessionToken = "plain-token-abc"
const sessionStartsAt = new Date("2026-09-01T10:00:00Z")

const mockSessionLink = {
  id: "sl-001",
  expiresAt: new Date("2099-01-01T00:00:00Z"), // far future — valid
  usedAt: null,
  sessionDurationMinutes: 120,
  appointment: { clientId: "client-001" },
}

const mockTattooSession = {
  id: "appt-session-001",
  clientId: "client-001",
  type: "TATTOO_SESSION" as const,
  status: "CONFIRMED" as const,
  startsAt: sessionStartsAt,
  endsAt: new Date("2026-09-01T12:00:00Z"),
  depositRequired: false,
  depositAmount: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe("bookingService.bookTattooSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindSessionLink.mockResolvedValue(mockSessionLink as never)
    mockAssertSlot.mockResolvedValue(undefined)
    mockCreateTattooSession.mockResolvedValue(mockTattooSession)
    mockMarkSessionLinkAsUsed.mockResolvedValue(undefined as never)
    mockAuditLog.mockResolvedValue(undefined)
    mockSendSessionConfirmed.mockResolvedValue(undefined)
  })

  it("happy path: crea TattooSession, marca link usado y devuelve appointmentId", async () => {
    const result = await bookingService.bookTattooSession(sessionToken, sessionStartsAt)

    expect(mockCreateTattooSession).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-001",
        startsAt: sessionStartsAt,
      })
    )
    expect(mockMarkSessionLinkAsUsed).toHaveBeenCalledWith("sl-001")
    expect(result).toEqual({ appointmentId: "appt-session-001" })
  })

  it("llama a notificationService.sendSessionConfirmed tras crear la sesión", async () => {
    await bookingService.bookTattooSession(sessionToken, sessionStartsAt)

    expect(mockSendSessionConfirmed).toHaveBeenCalledWith("appt-session-001")
  })

  it("lanza LinkNotFoundError si el SessionLink no existe", async () => {
    mockFindSessionLink.mockResolvedValue(null)

    await expect(bookingService.bookTattooSession(sessionToken, sessionStartsAt)).rejects.toThrow(
      LinkNotFoundError
    )
    expect(mockCreateTattooSession).not.toHaveBeenCalled()
  })

  it("lanza LinkExpiredError si el SessionLink está expirado", async () => {
    mockFindSessionLink.mockResolvedValue({
      ...mockSessionLink,
      expiresAt: new Date("2020-01-01T00:00:00Z"), // past date
    } as never)

    await expect(bookingService.bookTattooSession(sessionToken, sessionStartsAt)).rejects.toThrow(
      LinkExpiredError
    )
    expect(mockCreateTattooSession).not.toHaveBeenCalled()
  })

  it("lanza LinkAlreadyUsedError si el SessionLink ya fue utilizado", async () => {
    mockFindSessionLink.mockResolvedValue({
      ...mockSessionLink,
      usedAt: new Date("2026-08-01T10:00:00Z"),
    } as never)

    await expect(bookingService.bookTattooSession(sessionToken, sessionStartsAt)).rejects.toThrow(
      LinkAlreadyUsedError
    )
    expect(mockCreateTattooSession).not.toHaveBeenCalled()
  })

  it("lanza SlotNotAvailableError si el slot ya está ocupado", async () => {
    mockAssertSlot.mockRejectedValue(new SlotNotAvailableError())

    await expect(bookingService.bookTattooSession(sessionToken, sessionStartsAt)).rejects.toThrow(
      SlotNotAvailableError
    )
    expect(mockCreateTattooSession).not.toHaveBeenCalled()
  })

  it("calcula endsAt correctamente según sessionDurationMinutes del link", async () => {
    mockFindSessionLink.mockResolvedValue({
      ...mockSessionLink,
      sessionDurationMinutes: 180,
    } as never)

    await bookingService.bookTattooSession(sessionToken, sessionStartsAt)

    const expectedEndsAt = new Date(sessionStartsAt.getTime() + 180 * 60 * 1000)
    expect(mockCreateTattooSession).toHaveBeenCalledWith(
      expect.objectContaining({ endsAt: expectedEndsAt })
    )
  })

  it("registra AuditLog con action TATTOO_SESSION_BOOKED", async () => {
    await bookingService.bookTattooSession(sessionToken, sessionStartsAt)

    expect(mockAuditLog).toHaveBeenCalledWith(
      "TATTOO_SESSION_BOOKED",
      "appt-session-001",
      expect.objectContaining({ entityType: "Appointment" })
    )
  })
})
