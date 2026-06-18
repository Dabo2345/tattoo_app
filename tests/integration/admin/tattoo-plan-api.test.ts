import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { GET, POST } from "@/app/api/admin/appointments/[id]/tattoo-plan/route"
import { POST as POSTSend } from "@/app/api/admin/tattoo-plans/[planId]/send/route"

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

vi.mock("@/modules/booking/services/tattoo-plan-service", () => ({
  tattooPlanService: {
    createPlan: vi.fn(),
    getPlanByAppointmentId: vi.fn(),
    sendPlanToClient: vi.fn(),
  },
}))

import { tattooPlanService } from "@/modules/booking/services/tattoo-plan-service"

const mockCreatePlan = vi.mocked(tattooPlanService.createPlan)
const mockGetPlan = vi.mocked(tattooPlanService.getPlanByAppointmentId)
const mockSendPlan = vi.mocked(tattooPlanService.sendPlanToClient)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPlan = {
  id: "plan-001",
  consultationAppointmentId: "apt-001",
  style: "Blackwork",
  size: "20x20cm",
  placement: "Antebrazo izquierdo",
  description: "Mandala geométrico",
  notes: null,
  status: "DRAFT",
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [
    {
      id: "sess-001",
      planId: "plan-001",
      sessionNumber: 1,
      durationMinutes: 180,
      sessionLinkId: null,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
}

const validBody = {
  style: "Blackwork",
  size: "20x20cm",
  placement: "Antebrazo izquierdo",
  description: "Mandala geométrico",
  sessions: [{ sessionNumber: 1, durationMinutes: 180 }],
}

const appointmentParams = Promise.resolve({ id: "apt-001" })
const planParams = Promise.resolve({ planId: "plan-001" })

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/appointments/apt-001/tattoo-plan", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : {},
  })
}

// ─── GET /api/admin/appointments/:id/tattoo-plan ──────────────────────────────

describe("GET /api/admin/appointments/:id/tattoo-plan", () => {
  beforeEach(() => vi.clearAllMocks())

  it("retorna 200 con el plan y sus sesiones", async () => {
    mockGetPlan.mockResolvedValueOnce(mockPlan as never)
    const res = await GET(makeRequest("GET"), { params: appointmentParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe("plan-001")
    expect(body.data.sessions).toHaveLength(1)
  })

  it("retorna 404 si no existe plan para la cita", async () => {
    const { TattooPlanNotFoundError } = await import("@/lib/api/errors")
    mockGetPlan.mockRejectedValueOnce(new TattooPlanNotFoundError())
    const res = await GET(makeRequest("GET"), { params: appointmentParams })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })
})

// ─── POST /api/admin/appointments/:id/tattoo-plan ─────────────────────────────

describe("POST /api/admin/appointments/:id/tattoo-plan", () => {
  beforeEach(() => vi.clearAllMocks())

  it("retorna 201 con el plan creado en DRAFT", async () => {
    mockCreatePlan.mockResolvedValueOnce(mockPlan as never)
    const res = await POST(makeRequest("POST", validBody), { params: appointmentParams })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe("DRAFT")
  })

  it("retorna 422 si el appointment no está en estado válido", async () => {
    const { AppointmentInvalidForPlanError } = await import("@/lib/api/errors")
    mockCreatePlan.mockRejectedValueOnce(new AppointmentInvalidForPlanError())
    const res = await POST(makeRequest("POST", validBody), { params: appointmentParams })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe("INVALID_STATUS")
  })

  it("retorna 409 si ya existe un plan para la cita", async () => {
    const { TattooPlanAlreadyExistsError } = await import("@/lib/api/errors")
    mockCreatePlan.mockRejectedValueOnce(new TattooPlanAlreadyExistsError())
    const res = await POST(makeRequest("POST", validBody), { params: appointmentParams })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error.code).toBe("ALREADY_EXISTS")
  })

  it("retorna 400 si el body no pasa validación Zod", async () => {
    const res = await POST(makeRequest("POST", { style: "Blackwork" }), {
      params: appointmentParams,
    })
    expect(res.status).toBe(400)
  })
})

// ─── POST /api/admin/tattoo-plans/:planId/send ────────────────────────────────

describe("POST /api/admin/tattoo-plans/:planId/send", () => {
  beforeEach(() => vi.clearAllMocks())

  it("retorna 200 con el resultado del envío", async () => {
    mockSendPlan.mockResolvedValueOnce({ planId: "plan-001", status: "SENT", sessionsCount: 1 })
    const req = new NextRequest("http://localhost:3000/api/admin/tattoo-plans/plan-001/send", {
      method: "POST",
    })
    const res = await POSTSend(req, { params: planParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe("SENT")
  })

  it("retorna 404 si el plan no existe", async () => {
    const { TattooPlanNotFoundError } = await import("@/lib/api/errors")
    mockSendPlan.mockRejectedValueOnce(new TattooPlanNotFoundError())
    const req = new NextRequest("http://localhost:3000/api/admin/tattoo-plans/plan-xxx/send", {
      method: "POST",
    })
    const res = await POSTSend(req, { params: Promise.resolve({ planId: "plan-xxx" }) })
    expect(res.status).toBe(404)
  })

  it("retorna 422 si el plan ya fue enviado", async () => {
    const { TattooPlanInvalidStatusError } = await import("@/lib/api/errors")
    mockSendPlan.mockRejectedValueOnce(new TattooPlanInvalidStatusError())
    const req = new NextRequest("http://localhost:3000/api/admin/tattoo-plans/plan-001/send", {
      method: "POST",
    })
    const res = await POSTSend(req, { params: planParams })
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error.code).toBe("INVALID_STATUS")
  })
})
