import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/admin/calendar/route"

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

const appointment = {
  id: "apt-1",
  type: "CONSULTATION" as const,
  status: "CONFIRMED" as const,
  startsAt: new Date("2026-07-13T10:00:00.000Z"),
  endsAt: new Date("2026-07-13T11:00:00.000Z"),
  client: { name: "Ana García", email: "ana@example.com", phone: "+34600000000" },
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/calendar")
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url.toString())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/admin/calendar", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFindMany.mockResolvedValue([])
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )

    const res = await GET(
      makeRequest({ from: "2026-07-13T00:00:00.000Z", to: "2026-07-19T23:59:59.000Z" })
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("retorna 400 si faltan los params from y to", async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si solo falta 'to'", async () => {
    const res = await GET(makeRequest({ from: "2026-07-13T00:00:00.000Z" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si 'from' no es una fecha ISO válida", async () => {
    const res = await GET(makeRequest({ from: "not-a-date", to: "2026-07-19T23:59:59.000Z" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si 'from' es posterior a 'to'", async () => {
    const res = await GET(
      makeRequest({ from: "2026-07-20T00:00:00.000Z", to: "2026-07-13T00:00:00.000Z" })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 200 con array vacío si no hay citas en el rango", async () => {
    mockFindMany.mockResolvedValueOnce([])

    const res = await GET(
      makeRequest({ from: "2026-07-13T00:00:00.000Z", to: "2026-07-19T23:59:59.000Z" })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.appointments).toEqual([])
  })

  it("retorna 200 con las citas del rango mapeadas al contrato", async () => {
    mockFindMany.mockResolvedValueOnce([appointment] as never)

    const res = await GET(
      makeRequest({ from: "2026-07-13T00:00:00.000Z", to: "2026-07-19T23:59:59.000Z" })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.appointments).toHaveLength(1)

    const apt = body.data.appointments[0]
    expect(apt.id).toBe("apt-1")
    expect(apt.type).toBe("CONSULTATION")
    expect(apt.status).toBe("CONFIRMED")
    expect(apt.startsAt).toBe("2026-07-13T10:00:00.000Z")
    expect(apt.endsAt).toBe("2026-07-13T11:00:00.000Z")
    expect(apt.client.name).toBe("Ana García")
    expect(apt.client.email).toBe("ana@example.com")
    expect(apt.client.phone).toBe("+34600000000")
  })

  it("llama a prisma con el filtro de rango correcto", async () => {
    const from = "2026-07-13T00:00:00.000Z"
    const to = "2026-07-19T23:59:59.000Z"

    await GET(makeRequest({ from, to }))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          startsAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
        orderBy: { startsAt: "asc" },
      })
    )
  })
})
