import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/cron/send-reminders/route"
import { NextRequest } from "next/server"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/env", () => ({
  env: {
    CRON_SECRET: "test-cron-secret",
  },
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/modules/notification/repositories/notification-repository", () => ({
  notificationRepository: {
    existsByAppointmentAndType: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendReminder24h: vi.fn(),
    sendReminder2h: vi.fn(),
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { prisma } from "@/lib/db/prisma"
import { notificationRepository } from "@/modules/notification/repositories/notification-repository"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockFindMany = vi.mocked(prisma.appointment.findMany)
const mockExists = vi.mocked(notificationRepository.existsByAppointmentAndType)
const mockSend24h = vi.mocked(notificationService.sendReminder24h)
const mockSend2h = vi.mocked(notificationService.sendReminder2h)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(authHeader?: string): NextRequest {
  return new NextRequest("http://localhost/api/cron/send-reminders", {
    method: "POST",
    headers: authHeader ? { Authorization: authHeader } : {},
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/cron/send-reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMany.mockResolvedValue([])
    mockExists.mockResolvedValue(false)
    mockSend24h.mockResolvedValue(undefined)
    mockSend2h.mockResolvedValue(undefined)
  })

  it("devuelve 401 si no hay header Authorization", async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it("devuelve 401 si el Bearer token es incorrecto", async () => {
    const res = await POST(makeRequest("Bearer token-incorrecto"))
    expect(res.status).toBe(401)
  })

  it("devuelve 200 con sent24h y sent2h en 0 si no hay appointments", async () => {
    const res = await POST(makeRequest("Bearer test-cron-secret"))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ sent24h: 0, sent2h: 0 })
  })

  it("envía reminder 24h para appointments en ventana de 24h", async () => {
    mockFindMany
      .mockResolvedValueOnce([{ id: "appt-24h" }] as never) // 24h window
      .mockResolvedValueOnce([]) // 2h window
    mockExists.mockResolvedValue(false)

    const res = await POST(makeRequest("Bearer test-cron-secret"))

    expect(res.status).toBe(200)
    expect(mockSend24h).toHaveBeenCalledWith("appt-24h")
    expect(mockSend2h).not.toHaveBeenCalled()

    const body = await res.json()
    expect(body.data.sent24h).toBe(1)
    expect(body.data.sent2h).toBe(0)
  })

  it("envía reminder 2h para appointments en ventana de 2h", async () => {
    mockFindMany
      .mockResolvedValueOnce([]) // 24h window
      .mockResolvedValueOnce([{ id: "appt-2h" }] as never) // 2h window
    mockExists.mockResolvedValue(false)

    const res = await POST(makeRequest("Bearer test-cron-secret"))

    expect(res.status).toBe(200)
    expect(mockSend2h).toHaveBeenCalledWith("appt-2h")
    expect(mockSend24h).not.toHaveBeenCalled()

    const body = await res.json()
    expect(body.data.sent24h).toBe(0)
    expect(body.data.sent2h).toBe(1)
  })

  it("no duplica reminder si ya existe Notification del tipo (idempotencia)", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "appt-24h" }] as never).mockResolvedValueOnce([])
    mockExists.mockResolvedValue(true) // ya existe

    await POST(makeRequest("Bearer test-cron-secret"))

    expect(mockSend24h).not.toHaveBeenCalled()
  })

  it("envía solo los que no tienen Notification previa cuando hay mezcla", async () => {
    mockFindMany
      .mockResolvedValueOnce([{ id: "appt-a" }, { id: "appt-b" }] as never)
      .mockResolvedValueOnce([])
    mockExists
      .mockResolvedValueOnce(true) // appt-a ya enviado
      .mockResolvedValueOnce(false) // appt-b pendiente

    const res = await POST(makeRequest("Bearer test-cron-secret"))

    expect(mockSend24h).toHaveBeenCalledTimes(1)
    expect(mockSend24h).toHaveBeenCalledWith("appt-b")

    const body = await res.json()
    expect(body.data.sent24h).toBe(1)
  })

  it("verifica idempotencia con el tipo correcto para 24h", async () => {
    mockFindMany.mockResolvedValueOnce([{ id: "appt-24h" }] as never).mockResolvedValueOnce([])

    await POST(makeRequest("Bearer test-cron-secret"))

    expect(mockExists).toHaveBeenCalledWith("appt-24h", "REMINDER_24H")
  })

  it("verifica idempotencia con el tipo correcto para 2h", async () => {
    mockFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "appt-2h" }] as never)

    await POST(makeRequest("Bearer test-cron-secret"))

    expect(mockExists).toHaveBeenCalledWith("appt-2h", "REMINDER_2H")
  })
})
