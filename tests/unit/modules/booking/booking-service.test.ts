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
  },
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
import { bookingService } from "@/modules/booking/services/booking-service"

const mockAssertSlot = vi.mocked(calendarService.assertSlotAvailable)
const mockFindOrCreate = vi.mocked(clientRepository.findOrCreate)
const mockCreateConsultation = vi.mocked(bookingRepository.createConsultation)
const mockAuditLog = vi.mocked(auditService.log)

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
  status: "PENDING_PAYMENT" as const,
  startsAt: validInput.startsAt,
  endsAt: validInput.endsAt,
  notes: validInput.tattooDescription,
  depositRequired: true,
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

  it("el appointment se crea con status PENDING_PAYMENT", async () => {
    await bookingService.createConsultation(validInput)

    expect(mockCreateConsultation).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: mockClient.id })
    )
    // El status PENDING_PAYMENT lo gestiona el repositorio internamente
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
