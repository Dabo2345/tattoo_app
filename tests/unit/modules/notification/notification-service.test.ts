import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/resend/send-email", () => ({
  sendEmail: vi.fn(),
}))

vi.mock("@/modules/notification/repositories/notification-repository", () => ({
  notificationRepository: {
    create: vi.fn(),
    markSent: vi.fn(),
    markFailed: vi.fn(),
  },
}))

vi.mock("@/modules/booking/services/magic-link-service", () => ({
  magicLinkService: {
    createMagicLink: vi.fn(),
  },
}))

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://estudio.com",
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/modules/payment/services/deposit-policy", () => ({
  daysUntilAppointment: vi.fn((date: Date) =>
    Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  ),
}))

import { prisma } from "@/lib/db/prisma"
import { sendEmail } from "@/lib/resend/send-email"
import { notificationRepository } from "@/modules/notification/repositories/notification-repository"
import { magicLinkService } from "@/modules/booking/services/magic-link-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockFindUnique = vi.mocked(prisma.appointment.findUnique)
const mockSendEmail = vi.mocked(sendEmail)
const mockCreate = vi.mocked(notificationRepository.create)
const mockMarkSent = vi.mocked(notificationRepository.markSent)
const mockMarkFailed = vi.mocked(notificationRepository.markFailed)
const mockCreateMagicLink = vi.mocked(magicLinkService.createMagicLink)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseAppointment = {
  id: "appt-001",
  type: "CONSULTATION" as const,
  status: "CONFIRMED" as const,
  startsAt: new Date("2026-08-01T10:00:00Z"),
  endsAt: new Date("2026-08-01T11:00:00Z"),
  notes: null,
  depositRequired: true,
  depositAmount: null,
  clientId: "client-001",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  client: {
    id: "client-001",
    name: "Ana García",
    email: "ana@test.com",
    phone: "+34612345678",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
}

const mockNotification = {
  id: "notif-001",
  appointmentId: "appt-001",
  type: "CONSULTATION_CONFIRMED" as const,
  status: "PENDING" as const,
  sentAt: null,
  failedAt: null,
  errorMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue(mockNotification)
    mockMarkSent.mockResolvedValue({
      ...mockNotification,
      status: "SENT" as const,
      sentAt: new Date(),
    })
    mockMarkFailed.mockResolvedValue({ ...mockNotification, status: "FAILED" as const })
    mockSendEmail.mockResolvedValue({ success: true })
    mockCreateMagicLink.mockResolvedValue({ token: "tok-abc", expiresAt: new Date() })
  })

  // ─── sendConsultationConfirmed ───────────────────────────────────────────────

  describe("sendConsultationConfirmed", () => {
    it("crea Notification PENDING", async () => {
      mockFindUnique.mockResolvedValue({
        ...baseAppointment,
        payment: { id: "pay-001", amount: 50 },
      } as never)

      await notificationService.sendConsultationConfirmed("appt-001")

      expect(mockCreate).toHaveBeenCalledWith("appt-001", "CONSULTATION_CONFIRMED")
    })

    it("llama a sendEmail con el email del cliente", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, payment: null } as never)

      await notificationService.sendConsultationConfirmed("appt-001")

      expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@test.com" }))
    })

    it("llama a markSent cuando sendEmail tiene éxito", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, payment: null } as never)
      mockSendEmail.mockResolvedValue({ success: true })

      await notificationService.sendConsultationConfirmed("appt-001")

      expect(mockMarkSent).toHaveBeenCalledWith("notif-001")
      expect(mockMarkFailed).not.toHaveBeenCalled()
    })

    it("llama a markFailed cuando sendEmail falla", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, payment: null } as never)
      mockSendEmail.mockResolvedValue({ success: false, error: "Resend timeout" })

      await notificationService.sendConsultationConfirmed("appt-001")

      expect(mockMarkFailed).toHaveBeenCalledWith("notif-001", "Resend timeout")
      expect(mockMarkSent).not.toHaveBeenCalled()
    })

    it("no lanza excepción aunque falle todo", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB down"))

      await expect(
        notificationService.sendConsultationConfirmed("appt-001")
      ).resolves.toBeUndefined()
    })

    it("no hace nada si el appointment no existe", async () => {
      mockFindUnique.mockResolvedValue(null)

      await notificationService.sendConsultationConfirmed("appt-001")

      expect(mockCreate).not.toHaveBeenCalled()
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it("incluye el magicLinkToken en la URL del payload", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, payment: null } as never)
      mockCreateMagicLink.mockResolvedValue({ token: "tok-xyz", expiresAt: new Date() })

      await notificationService.sendConsultationConfirmed("appt-001")

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          react: expect.objectContaining({
            props: expect.objectContaining({
              magicLinkUrl: "https://estudio.com/magic-link/tok-xyz",
            }),
          }),
        })
      )
    })
  })

  // ─── sendSessionConfirmed ────────────────────────────────────────────────────

  describe("sendSessionConfirmed", () => {
    it("crea Notification PENDING con tipo SESSION_CONFIRMED", async () => {
      mockFindUnique.mockResolvedValue(baseAppointment as never)

      await notificationService.sendSessionConfirmed("appt-001")

      expect(mockCreate).toHaveBeenCalledWith("appt-001", "SESSION_CONFIRMED")
    })

    it("llama a markSent cuando sendEmail tiene éxito", async () => {
      mockFindUnique.mockResolvedValue(baseAppointment as never)

      await notificationService.sendSessionConfirmed("appt-001")

      expect(mockMarkSent).toHaveBeenCalledWith("notif-001")
    })

    it("no lanza excepción aunque falle todo", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB down"))

      await expect(notificationService.sendSessionConfirmed("appt-001")).resolves.toBeUndefined()
    })
  })

  // ─── sendAppointmentCancelled ────────────────────────────────────────────────

  describe("sendAppointmentCancelled", () => {
    it("crea Notification PENDING con tipo APPOINTMENT_CANCELLED", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, payment: null } as never)

      await notificationService.sendAppointmentCancelled("appt-001")

      expect(mockCreate).toHaveBeenCalledWith("appt-001", "APPOINTMENT_CANCELLED")
    })

    it("refundAmount es 0 cuando no hay payment", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, payment: null } as never)

      await notificationService.sendAppointmentCancelled("appt-001")

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          react: expect.objectContaining({
            props: expect.objectContaining({ refundAmount: 0, refundDays: 0 }),
          }),
        })
      )
    })

    it("no lanza excepción aunque falle todo", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB down"))

      await expect(
        notificationService.sendAppointmentCancelled("appt-001")
      ).resolves.toBeUndefined()
    })
  })

  // ─── sendAppointmentRescheduled ──────────────────────────────────────────────

  describe("sendAppointmentRescheduled", () => {
    it("crea Notification PENDING con tipo APPOINTMENT_RESCHEDULED", async () => {
      mockFindUnique.mockResolvedValue(baseAppointment as never)

      await notificationService.sendAppointmentRescheduled(
        "appt-001",
        new Date("2026-07-30T10:00:00Z")
      )

      expect(mockCreate).toHaveBeenCalledWith("appt-001", "APPOINTMENT_RESCHEDULED")
    })

    it("no lanza excepción aunque falle todo", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB down"))

      await expect(
        notificationService.sendAppointmentRescheduled("appt-001", new Date())
      ).resolves.toBeUndefined()
    })
  })

  // ─── sendMagicLink ───────────────────────────────────────────────────────────

  describe("sendMagicLink", () => {
    it("usa el token para construir la URL correcta", async () => {
      mockFindUnique.mockResolvedValue(baseAppointment as never)

      await notificationService.sendMagicLink("appt-001", "tok-magic-123")

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          react: expect.objectContaining({
            props: expect.objectContaining({
              magicLinkUrl: "https://estudio.com/magic-link/tok-magic-123",
            }),
          }),
        })
      )
    })

    it("crea Notification PENDING con tipo MAGIC_LINK_SENT", async () => {
      mockFindUnique.mockResolvedValue(baseAppointment as never)

      await notificationService.sendMagicLink("appt-001", "tok-magic-123")

      expect(mockCreate).toHaveBeenCalledWith("appt-001", "MAGIC_LINK_SENT")
    })

    it("no lanza excepción aunque falle todo", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB down"))

      await expect(
        notificationService.sendMagicLink("appt-001", "tok-magic-123")
      ).resolves.toBeUndefined()
    })
  })

  // ─── sendSessionLink ─────────────────────────────────────────────────────────

  describe("sendSessionLink", () => {
    it("usa el token para construir la URL correcta", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, sessionLink: null } as never)

      await notificationService.sendSessionLink("appt-001", "tok-session-456")

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          react: expect.objectContaining({
            props: expect.objectContaining({
              sessionLinkUrl: "https://estudio.com/book/tok-session-456",
            }),
          }),
        })
      )
    })

    it("crea Notification PENDING con tipo SESSION_LINK_SENT", async () => {
      mockFindUnique.mockResolvedValue({ ...baseAppointment, sessionLink: null } as never)

      await notificationService.sendSessionLink("appt-001", "tok-session-456")

      expect(mockCreate).toHaveBeenCalledWith("appt-001", "SESSION_LINK_SENT")
    })

    it("no lanza excepción aunque falle todo", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB down"))

      await expect(
        notificationService.sendSessionLink("appt-001", "tok-session-456")
      ).resolves.toBeUndefined()
    })
  })
})
