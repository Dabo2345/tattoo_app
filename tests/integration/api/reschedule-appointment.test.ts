import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHash } from "crypto"
import { POST } from "@/app/api/appointments/[id]/reschedule/route"
import { NextRequest } from "next/server"
import { AppointmentNotFoundError, SlotNotAvailableError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/repositories/booking-repository", () => ({
  bookingRepository: {
    findMagicLinkByHash: vi.fn(),
    findAppointmentById: vi.fn(),
    rescheduleAppointment: vi.fn(),
  },
}))

vi.mock("@/modules/calendar/services/calendar-service", () => ({
  calendarService: {
    assertSlotAvailable: vi.fn(),
  },
}))

vi.mock("@/modules/audit/services/audit-service", () => ({
  auditService: {
    log: vi.fn(),
  },
}))

import { bookingRepository } from "@/modules/booking/repositories/booking-repository"
import { calendarService } from "@/modules/calendar/services/calendar-service"
import { auditService } from "@/modules/audit/services/audit-service"

const mockFindMagicLink = vi.mocked(bookingRepository.findMagicLinkByHash)
const mockFindAppointment = vi.mocked(bookingRepository.findAppointmentById)
const mockRescheduleAppointment = vi.mocked(bookingRepository.rescheduleAppointment)
const mockAuditLog = vi.mocked(auditService.log)
const mockAssertSlotAvailable = vi.mocked(calendarService.assertSlotAvailable)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const appointmentId = "appt-001"
const rawToken = "secure-token-xyz789"
const tokenHash = createHash("sha256").update(rawToken).digest("hex")

const futureDateDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

const mockMagicLink = {
  id: "ml-001",
  appointmentId,
  tokenHash,
  expiresAt: futureDateDays(7),
  purpose: "MANAGE_APPOINTMENT",
}

const mockAppointment = {
  id: appointmentId,
  clientId: "client-001",
  status: "CONFIRMED",
  startsAt: futureDateDays(10),
  endsAt: futureDateDays(10),
  depositAmount: 50,
}

// newStartAt: 15 días desde ahora a las 10:00 UTC
const newStartAt = (() => {
  const d = futureDateDays(15)
  d.setUTCHours(10, 0, 0, 0)
  return d
})()

const ctx = { params: Promise.resolve({ id: appointmentId }) }

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/appointments/${appointmentId}/reschedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/appointments/:id/reschedule", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindMagicLink.mockResolvedValue(mockMagicLink as never)
    mockFindAppointment.mockResolvedValue(mockAppointment as never)
    mockRescheduleAppointment.mockResolvedValue(mockAppointment as never)
    mockAuditLog.mockResolvedValue(undefined)
    mockAssertSlotAvailable.mockResolvedValue(undefined)
  })

  it("reprograma la cita y devuelve rescheduled: true", async () => {
    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.rescheduled).toBe(true)
    expect(body.data.newStartAt).toBe(newStartAt.toISOString())
    expect(mockRescheduleAppointment).toHaveBeenCalledWith(
      appointmentId,
      expect.any(Date),
      expect.any(Date)
    )
  })

  it("calcula newEndsAt como newStartAt + 60 minutos", async () => {
    await POST(makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }), ctx)

    const call = mockRescheduleAppointment.mock.calls[0]!
    const newEndsAt = call[2]
    const expectedEndsAt = new Date(newStartAt)
    expectedEndsAt.setMinutes(expectedEndsAt.getMinutes() + 60)
    expect(newEndsAt.toISOString()).toBe(expectedEndsAt.toISOString())
  })

  it("devuelve 410 si el magic link no existe", async () => {
    mockFindMagicLink.mockResolvedValue(null)

    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.error.code).toBe("LINK_EXPIRED")
  })

  it("devuelve 410 si el magic link está expirado", async () => {
    mockFindMagicLink.mockResolvedValue({
      ...mockMagicLink,
      expiresAt: new Date(Date.now() - 1000),
    } as never)

    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(410)
  })

  it("devuelve 410 si el token no corresponde al appointment", async () => {
    mockFindMagicLink.mockResolvedValue({
      ...mockMagicLink,
      appointmentId: "otro-appointment",
    } as never)

    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(410)
  })

  it("devuelve 404 si el appointment no existe", async () => {
    mockFindAppointment.mockRejectedValue(new AppointmentNotFoundError())

    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(404)
  })

  it("devuelve 409 RESCHEDULE_NOT_ALLOWED si la cita está dentro de 4 días", async () => {
    mockFindAppointment.mockResolvedValue({
      ...mockAppointment,
      startsAt: futureDateDays(2), // solo 2 días
    } as never)

    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("RESCHEDULE_NOT_ALLOWED")
    expect(mockRescheduleAppointment).not.toHaveBeenCalled()
  })

  it("devuelve 409 SLOT_NOT_AVAILABLE si el nuevo slot está ocupado", async () => {
    mockAssertSlotAvailable.mockRejectedValue(new SlotNotAvailableError())

    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
  })

  it("devuelve 409 RESCHEDULE_NOT_ALLOWED si la cita no está CONFIRMED", async () => {
    mockFindAppointment.mockResolvedValue({
      ...mockAppointment,
      status: "CANCELLED",
    } as never)

    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }),
      ctx
    )

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("RESCHEDULE_NOT_ALLOWED")
  })

  it("devuelve 400 si falta magicLinkToken", async () => {
    const res = await POST(makeRequest({ newStartAt: newStartAt.toISOString() }), ctx)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si falta newStartAt", async () => {
    const res = await POST(makeRequest({ magicLinkToken: rawToken }), ctx)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si newStartAt no es una fecha ISO válida", async () => {
    const res = await POST(
      makeRequest({ magicLinkToken: rawToken, newStartAt: "no-es-fecha" }),
      ctx
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("crea AuditLog APPOINTMENT_RESCHEDULED con metadata de fechas", async () => {
    await POST(makeRequest({ magicLinkToken: rawToken, newStartAt: newStartAt.toISOString() }), ctx)

    expect(mockAuditLog).toHaveBeenCalledWith(
      "APPOINTMENT_RESCHEDULED",
      appointmentId,
      expect.objectContaining({
        entityType: "Appointment",
        metadata: expect.objectContaining({ newStartsAt: newStartAt.toISOString() }),
      })
    )
  })
})
