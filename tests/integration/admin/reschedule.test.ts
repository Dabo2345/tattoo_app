import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/admin/appointments/[id]/reschedule/route"
import { SlotNotAvailableError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  withAdminAuth: vi.fn(async (_req: Request, handler: (s: unknown) => Promise<Response>) =>
    handler({ user: { id: "admin-1", email: "admin@example.com" } })
  ),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock("@/modules/calendar/services/calendar-service", () => ({
  calendarService: {
    assertSlotAvailable: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendAppointmentRescheduled: vi.fn(),
  },
}))

import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { calendarService } from "@/modules/calendar/services/calendar-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockFindFirst = vi.mocked(prisma.appointment.findFirst)
const mockUpdate = vi.mocked(prisma.appointment.update)
const mockAuditCreate = vi.mocked(prisma.auditLog.create)
const mockWithAdminAuth = vi.mocked(withAdminAuth)
const mockAssertSlotAvailable = vi.mocked(calendarService.assertSlotAvailable)
const mockSendRescheduled = vi.mocked(notificationService.sendAppointmentRescheduled)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ORIGINAL_START = new Date("2026-07-13T10:00:00.000Z")
const ORIGINAL_END = new Date("2026-07-13T11:30:00.000Z") // 90 min duration
const NEW_START = "2026-07-20T10:00:00.000Z"

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: "apt-1",
    type: "CONSULTATION",
    status: "CONFIRMED",
    startsAt: ORIGINAL_START,
    endsAt: ORIGINAL_END,
    ...overrides,
  }
}

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/appointments/apt-1/reschedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const params = Promise.resolve({ id: "apt-1" })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/appointments/[id]/reschedule", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockUpdate.mockResolvedValue({} as never)
    mockAuditCreate.mockResolvedValue({} as never)
    mockAssertSlotAvailable.mockResolvedValue(undefined)
    mockSendRescheduled.mockResolvedValue(undefined)
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )
    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(401)
  })

  it("retorna 400 si el body es inválido (no JSON)", async () => {
    const req = new Request("http://localhost:3000/api/admin/appointments/apt-1/reschedule", {
      method: "POST",
      body: "not-json",
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si newStartAt no es una fecha ISO válida", async () => {
    const res = await POST(makeRequest({ newStartAt: "not-a-date" }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 404 si la cita no existe", async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("retorna 409 si el nuevo slot está ocupado por otra cita", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)
    mockAssertSlotAvailable.mockRejectedValueOnce(new SlotNotAvailableError())

    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
  })

  it("retorna 409 si el nuevo slot coincide con un BlockedPeriod", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)
    mockAssertSlotAvailable.mockRejectedValueOnce(new SlotNotAvailableError())

    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
    expect(mockAssertSlotAvailable).toHaveBeenCalledOnce()
  })

  it("retorna 200 y actualiza la cita en caso exitoso", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.appointment.startsAt).toBe(NEW_START)
  })

  it("calcula newEndsAt preservando la duración original (90 min)", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    const body = await res.json()

    const expectedEnd = new Date(new Date(NEW_START).getTime() + 90 * 60 * 1000).toISOString()
    expect(body.data.appointment.endsAt).toBe(expectedEnd)
  })

  it("llama a calendarService.assertSlotAvailable con el nuevo rango de fechas", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    await POST(makeRequest({ newStartAt: NEW_START }), { params })

    const expectedStart = new Date(NEW_START)
    const expectedEnd = new Date(expectedStart.getTime() + 90 * 60 * 1000)
    expect(mockAssertSlotAvailable).toHaveBeenCalledWith(expectedStart, expectedEnd)
  })

  it("crea un AuditLog con APPOINTMENT_RESCHEDULED y metadata de fechas", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    await POST(makeRequest({ newStartAt: NEW_START }), { params })

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "APPOINTMENT_RESCHEDULED",
          entityId: "apt-1",
          adminUserId: "admin-1",
          metadata: expect.objectContaining({
            oldStartAt: ORIGINAL_START.toISOString(),
            newStartAt: NEW_START,
          }),
        }),
      })
    )
  })

  it("envía notificación de reprogramación con la fecha anterior", async () => {
    mockFindFirst.mockResolvedValueOnce(makeAppointment() as never)

    await POST(makeRequest({ newStartAt: NEW_START }), { params })

    expect(mockSendRescheduled).toHaveBeenCalledWith("apt-1", ORIGINAL_START)
  })
})
