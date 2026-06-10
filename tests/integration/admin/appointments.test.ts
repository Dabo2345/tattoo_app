import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/admin/appointments/route"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  withAdminAuth: vi.fn(async (_req: Request, handler: (s: unknown) => Promise<Response>) =>
    handler({ user: { id: "admin-1", email: "admin@example.com" } })
  ),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
    },
  },
}))

import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const mockFindMany = vi.mocked(prisma.appointment.findMany)
const mockWithAdminAuth = vi.mocked(withAdminAuth)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: "apt-1",
    type: "CONSULTATION",
    status: "CONFIRMED",
    startsAt: new Date("2026-07-13T10:00:00.000Z"),
    endsAt: new Date("2026-07-13T11:00:00.000Z"),
    notes: null,
    depositRequired: true,
    depositAmount: null,
    client: { name: "Ana García", email: "ana@example.com", phone: "+34600000000" },
    ...overrides,
  }
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/appointments")
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url.toString())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/admin/appointments", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFindMany.mockResolvedValue([])
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("retorna 200 con lista vacía si no hay citas", async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.appointments).toEqual([])
    expect(body.data.total).toBe(0)
  })

  it("retorna todas las citas sin filtros", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeAppointment(),
      makeAppointment({ id: "apt-2" }),
    ] as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.appointments).toHaveLength(2)
    expect(body.data.total).toBe(2)
  })

  it("mapea correctamente los campos al contrato", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeAppointment({ depositAmount: { toFixed: () => "50.00" } }),
    ] as never)

    const res = await GET(makeRequest())
    const body = await res.json()
    const apt = body.data.appointments[0]

    expect(apt.id).toBe("apt-1")
    expect(apt.startsAt).toBe("2026-07-13T10:00:00.000Z")
    expect(apt.endsAt).toBe("2026-07-13T11:00:00.000Z")
    expect(apt.client.name).toBe("Ana García")
    expect(apt.depositRequired).toBe(true)
  })

  it("aplica filtro por status=CONFIRMED", async () => {
    await GET(makeRequest({ status: "CONFIRMED" }))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "CONFIRMED" }),
      })
    )
  })

  it("aplica filtro por type=TATTOO_SESSION", async () => {
    await GET(makeRequest({ type: "TATTOO_SESSION" }))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: "TATTOO_SESSION" }),
      })
    )
  })

  it("aplica filtro de rango de fechas from/to", async () => {
    const from = "2026-07-01T00:00:00.000Z"
    const to = "2026-07-31T23:59:59.000Z"

    await GET(makeRequest({ from, to }))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startsAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
      })
    )
  })

  it("retorna 400 con status inválido", async () => {
    const res = await GET(makeRequest({ status: "INVALID_STATUS" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 con type inválido", async () => {
    const res = await GET(makeRequest({ type: "INVALID_TYPE" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("ordena por startsAt DESC", async () => {
    await GET(makeRequest())

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { startsAt: "desc" },
      })
    )
  })

  it("filtra citas borradas (deletedAt: null)", async () => {
    await GET(makeRequest())

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )
  })
})
