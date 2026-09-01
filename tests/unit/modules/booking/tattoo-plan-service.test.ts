import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  AppointmentInvalidForPlanError,
  TattooPlanAlreadyExistsError,
  TattooPlanNotFoundError,
  TattooPlanInvalidStatusError,
} from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findAppointmentById: vi.fn(),
    createSessionLink: vi.fn(),
  },
}))

vi.mock("@/modules/booking/repositories/tattoo-plan-repository", () => ({
  tattooPlanRepository: {
    create: vi.fn(),
    findByAppointmentId: vi.fn(),
    findById: vi.fn(),
    updateSessionLinkId: vi.fn(),
    updatePlanStatus: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: { log: vi.fn() },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: { sendTattooPlan: vi.fn() },
}))

vi.mock("@/lib/utils/tokens", () => ({
  generateSecureToken: vi.fn().mockReturnValue("plain-token"),
  hashToken: vi.fn().mockReturnValue("hashed-token"),
}))

import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { tattooPlanRepository } from "@/modules/booking/repositories/tattoo-plan-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"
import { tattooPlanService } from "@/modules/booking/services/tattoo-plan-service"

const mockFindAppointment = vi.mocked(bookingRepository.findAppointmentById)
const mockCreateSessionLink = vi.mocked(bookingRepository.createSessionLink)
const mockRepoCreate = vi.mocked(tattooPlanRepository.create)
const mockRepoFindByAppointment = vi.mocked(tattooPlanRepository.findByAppointmentId)
const mockRepoFindById = vi.mocked(tattooPlanRepository.findById)
const mockUpdateSessionLinkId = vi.mocked(tattooPlanRepository.updateSessionLinkId)
const mockUpdatePlanStatus = vi.mocked(tattooPlanRepository.updatePlanStatus)
const mockAuditLog = vi.mocked(auditService.log)
const mockSendTattooPlan = vi.mocked(notificationService.sendTattooPlan)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const confirmedConsultation = {
  id: "apt-001",
  type: "CONSULTATION" as const,
  status: "CONFIRMED" as const,
  clientId: "client-001",
  startsAt: new Date("2026-08-01T10:00:00Z"),
  endsAt: new Date("2026-08-01T11:00:00Z"),
  depositRequired: false,
  depositAmount: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  client: {
    id: "client-001",
    name: "Ana García",
    email: "ana@example.com",
    phone: "+34600000000",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
}

const validInput = {
  style: "Blackwork",
  size: "20x20cm",
  placement: "Antebrazo izquierdo",
  description: "Mandala geométrico",
  sessions: [
    { sessionNumber: 1, durationMinutes: 180 },
    { sessionNumber: 2, durationMinutes: 120 },
  ],
}

const mockPlanDraft = {
  id: "plan-001",
  consultationAppointmentId: "apt-001",
  style: "Blackwork",
  size: "20x20cm",
  placement: "Antebrazo izquierdo",
  description: "Mandala geométrico",
  notes: null,
  status: "DRAFT" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [
    {
      id: "sess-001",
      planId: "plan-001",
      sessionNumber: 1,
      durationMinutes: 180,
      sessionLinkId: null,
      status: "PENDING" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "sess-002",
      planId: "plan-001",
      sessionNumber: 2,
      durationMinutes: 120,
      sessionLinkId: null,
      status: "PENDING" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
}

const mockSessionLink = {
  id: "sl-001",
  appointmentId: "apt-001",
  tokenHash: "hashed-token",
  expiresAt: new Date("2099-01-01"),
  usedAt: null,
  sessionDurationMinutes: 180,
  artistNotes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── createPlan ───────────────────────────────────────────────────────────────

describe("tattooPlanService.createPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindAppointment.mockResolvedValue(confirmedConsultation as never)
    mockRepoFindByAppointment.mockResolvedValue(null)
    mockRepoCreate.mockResolvedValue(mockPlanDraft as never)
  })

  it("crea plan en DRAFT para appointment CONFIRMED + CONSULTATION", async () => {
    const result = await tattooPlanService.createPlan("apt-001", validInput)
    expect(mockRepoCreate).toHaveBeenCalledWith("apt-001", validInput)
    expect(result.status).toBe("DRAFT")
  })

  it("lanza AppointmentInvalidForPlanError si el appointment no es CONSULTATION", async () => {
    mockFindAppointment.mockResolvedValue({
      ...confirmedConsultation,
      type: "TATTOO_SESSION",
    } as never)
    await expect(tattooPlanService.createPlan("apt-001", validInput)).rejects.toThrow(
      AppointmentInvalidForPlanError
    )
    expect(mockRepoCreate).not.toHaveBeenCalled()
  })

  it("lanza AppointmentInvalidForPlanError si el appointment no está CONFIRMED", async () => {
    mockFindAppointment.mockResolvedValue({
      ...confirmedConsultation,
      status: "PENDING_PAYMENT",
    } as never)
    await expect(tattooPlanService.createPlan("apt-001", validInput)).rejects.toThrow(
      AppointmentInvalidForPlanError
    )
    expect(mockRepoCreate).not.toHaveBeenCalled()
  })

  it("lanza TattooPlanAlreadyExistsError si ya existe un plan para esta cita", async () => {
    mockRepoFindByAppointment.mockResolvedValue(mockPlanDraft as never)
    await expect(tattooPlanService.createPlan("apt-001", validInput)).rejects.toThrow(
      TattooPlanAlreadyExistsError
    )
    expect(mockRepoCreate).not.toHaveBeenCalled()
  })
})

// ─── sendPlanToClient ─────────────────────────────────────────────────────────

describe("tattooPlanService.sendPlanToClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRepoFindById.mockResolvedValue(mockPlanDraft as never)
    mockCreateSessionLink.mockResolvedValue({ ...mockSessionLink, id: "sl-001" } as never)
    mockUpdateSessionLinkId.mockResolvedValue(undefined as never)
    mockUpdatePlanStatus.mockResolvedValue(undefined as never)
    mockAuditLog.mockResolvedValue(undefined)
    mockSendTattooPlan.mockResolvedValue(undefined)
  })

  it("crea un SessionLink por cada sesión y actualiza status a SENT", async () => {
    const result = await tattooPlanService.sendPlanToClient("plan-001")

    expect(mockCreateSessionLink).toHaveBeenCalledTimes(2)
    expect(mockUpdateSessionLinkId).toHaveBeenCalledTimes(2)
    expect(mockUpdatePlanStatus).toHaveBeenCalledWith("plan-001", "SENT")
    expect(result.status).toBe("SENT")
    expect(result.sessionsCount).toBe(2)
  })

  it("lanza TattooPlanNotFoundError si el plan no existe", async () => {
    mockRepoFindById.mockResolvedValue(null)
    await expect(tattooPlanService.sendPlanToClient("plan-xxx")).rejects.toThrow(
      TattooPlanNotFoundError
    )
    expect(mockCreateSessionLink).not.toHaveBeenCalled()
  })

  it("lanza TattooPlanInvalidStatusError si el plan ya fue enviado (SENT)", async () => {
    mockRepoFindById.mockResolvedValue({ ...mockPlanDraft, status: "SENT" } as never)
    await expect(tattooPlanService.sendPlanToClient("plan-001")).rejects.toThrow(
      TattooPlanInvalidStatusError
    )
    expect(mockCreateSessionLink).not.toHaveBeenCalled()
  })

  it("registra AuditLog con acción TATTOO_PLAN_SENT", async () => {
    await tattooPlanService.sendPlanToClient("plan-001")
    expect(mockAuditLog).toHaveBeenCalledWith(
      "TATTOO_PLAN_SENT",
      "plan-001",
      expect.objectContaining({ entityType: "TattooPlan" })
    )
  })

  it("llama a notificationService.sendTattooPlan con planId y sessionTokens", async () => {
    await tattooPlanService.sendPlanToClient("plan-001")
    expect(mockSendTattooPlan).toHaveBeenCalledWith(
      "plan-001",
      expect.arrayContaining([
        expect.objectContaining({ sessionNumber: expect.any(Number), token: expect.any(String) }),
      ])
    )
  })

  it("crea SessionLink con la durationMinutes correcta de cada sesión", async () => {
    await tattooPlanService.sendPlanToClient("plan-001")

    const calls = mockCreateSessionLink.mock.calls
    expect(calls[0][0]).toMatchObject({ sessionDurationMinutes: 180 })
    expect(calls[1][0]).toMatchObject({ sessionDurationMinutes: 120 })
  })
})
