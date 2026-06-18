import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/consultations/route"
import { NextRequest } from "next/server"
import { SlotNotAvailableError } from "@/lib/api/errors"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/booking/services/booking-service", () => ({
  bookingService: {
    createConsultation: vi.fn(),
  },
}))

vi.mock("@/modules/notification/services/notification-service", () => ({
  notificationService: {
    sendConsultationConfirmed: vi.fn(),
  },
}))

import { bookingService } from "@/modules/booking/services/booking-service"
import { notificationService } from "@/modules/notification/services/notification-service"

const mockCreateConsultation = vi.mocked(bookingService.createConsultation)
const mockSendConfirmed = vi.mocked(notificationService.sendConsultationConfirmed)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ctx = { params: Promise.resolve({}) }

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/consultations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validBody = {
  name: "Ana García",
  email: "ana@example.com",
  phone: "+34612345678",
  tattooDescription: "Rosa pequeña en muñeca",
  startsAt: "2026-08-01T10:00:00Z",
  endsAt: "2026-08-01T11:00:00Z",
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/consultations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateConsultation.mockResolvedValue({ appointmentId: "appt-001", clientId: "client-001" })
    mockSendConfirmed.mockResolvedValue(undefined)
  })

  it("devuelve 201 con appointmentId y status CONFIRMED cuando los datos son válidos", async () => {
    const res = await POST(makeRequest(validBody), ctx)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({
      appointmentId: "appt-001",
      status: "CONFIRMED",
    })
  })

  it("no devuelve stripeCheckoutUrl en la respuesta", async () => {
    const res = await POST(makeRequest(validBody), ctx)
    const body = await res.json()

    expect(body.data).not.toHaveProperty("stripeCheckoutUrl")
    expect(body.data).not.toHaveProperty("checkoutUrl")
  })

  it("llama a bookingService.createConsultation con los datos correctos", async () => {
    await POST(makeRequest(validBody), ctx)

    expect(mockCreateConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validBody.name,
        email: validBody.email,
        phone: validBody.phone,
        tattooDescription: validBody.tattooDescription,
      })
    )
  })

  it("llama a notificationService.sendConsultationConfirmed con el appointmentId", async () => {
    await POST(makeRequest(validBody), ctx)

    expect(mockSendConfirmed).toHaveBeenCalledWith("appt-001")
  })

  it("devuelve 400 VALIDATION_ERROR si el email es inválido", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "no-es-un-email" }), ctx)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 VALIDATION_ERROR si falta startsAt", async () => {
    const { startsAt: _, ...bodyWithoutStartsAt } = validBody
    const res = await POST(makeRequest(bodyWithoutStartsAt), ctx)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 409 SLOT_NOT_AVAILABLE si el slot está ocupado", async () => {
    mockCreateConsultation.mockRejectedValue(new SlotNotAvailableError())

    const res = await POST(makeRequest(validBody), ctx)

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("SLOT_NOT_AVAILABLE")
  })
})
