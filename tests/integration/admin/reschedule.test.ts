import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { POST } from "@/app/api/admin/appointments/[id]/reschedule/route"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/api/middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/middleware")>()
  return {
    ...actual,
    withAdminAuth: vi.fn(
      (handler: (req: unknown, ctx: unknown, session: unknown) => Promise<NextResponse>) =>
        actual.withErrorHandler(async (req, ctx) =>
          handler(req, ctx, { user: { id: "admin-1", email: "admin@example.com" } })
        )
    ),
  }
})

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findAppointmentById: vi.fn(),
    rescheduleAppointment: vi.fn(),
  },
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendAppointmentRescheduled: vi.fn(),
  },
}))

import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { prisma } from "@/lib/db/prisma"
import { auditService } from "@/modules/audit/services/audit-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockFindAppointmentById = vi.mocked(bookingRepository.findAppointmentById)
const mockRescheduleAppointment = vi.mocked(bookingRepository.rescheduleAppointment)
const mockFindConflict = vi.mocked(prisma.appointment.findFirst)
const mockAuditLog = vi.mocked(auditService.log)
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
    clientId: "client-1",
    ...overrides,
  }
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/appointments/apt-1/reschedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const params = Promise.resolve({ id: "apt-1" })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/appointments/[id]/reschedule", () => {
  beforeEach(() => {
    // clearAllMocks preserves factory implementations (withAdminAuth wrapper)
    // while resetting per-test return values and call history
    vi.clearAllMocks()
  })

  // Note: 401 auth rejection is tested in middleware.test.ts.
  // withAdminAuth is evaluated at module import time in the new pattern,
  // so per-request auth simulation is handled at the middleware layer.

  it("retorna 400 si newStartAt no es una fecha ISO válida", async () => {
    const res = await POST(makeRequest({ newStartAt: "not-a-date" }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 404 si la cita no existe", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("retorna 409 si el nuevo slot está ocupado", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockFindConflict.mockResolvedValueOnce({ id: "apt-other" } as never)

    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
  })

  it("retorna 200 y actualiza la cita en caso exitoso", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockFindConflict.mockResolvedValueOnce(null) // no conflict

    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.appointment.startsAt).toBe(NEW_START)
  })

  it("calcula newEndsAt preservando la duración original (90 min)", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockFindConflict.mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ newStartAt: NEW_START }), { params })
    const body = await res.json()

    const expectedEnd = new Date(new Date(NEW_START).getTime() + 90 * 60 * 1000).toISOString()
    expect(body.data.appointment.endsAt).toBe(expectedEnd)
  })

  it("crea un AuditLog con APPOINTMENT_RESCHEDULED y metadata de fechas", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockFindConflict.mockResolvedValueOnce(null)

    await POST(makeRequest({ newStartAt: NEW_START }), { params })

    expect(mockAuditLog).toHaveBeenCalledWith(
      "APPOINTMENT_RESCHEDULED",
      "apt-1",
      expect.objectContaining({
        entityType: "Appointment",
        adminUserId: "admin-1",
        metadata: expect.objectContaining({
          oldStartAt: ORIGINAL_START.toISOString(),
          newStartAt: NEW_START,
        }),
      })
    )
  })

  it("no cuenta la propia cita como conflicto (query excluye el id actual)", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockFindConflict.mockResolvedValueOnce(null)

    await POST(makeRequest({ newStartAt: NEW_START }), { params })

    expect(mockFindConflict).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "apt-1" },
        }),
      })
    )
  })

  it("envía notificación de reprogramación con la fecha original", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockFindConflict.mockResolvedValueOnce(null)

    await POST(makeRequest({ newStartAt: NEW_START }), { params })

    expect(mockSendRescheduled).toHaveBeenCalledWith("apt-1", ORIGINAL_START)
  })

  it("llama a rescheduleAppointment con las fechas calculadas correctamente", async () => {
    mockFindAppointmentById.mockResolvedValueOnce(makeAppointment() as never)
    mockFindConflict.mockResolvedValueOnce(null)

    await POST(makeRequest({ newStartAt: NEW_START }), { params })

    const expectedEnd = new Date(new Date(NEW_START).getTime() + 90 * 60 * 1000)
    expect(mockRescheduleAppointment).toHaveBeenCalledWith(
      "apt-1",
      new Date(NEW_START),
      expectedEnd
    )
  })
})
