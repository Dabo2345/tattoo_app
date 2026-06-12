import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/availability/route"
import { NextRequest } from "next/server"

vi.mock("@/modules/calendar/services/calendar-service", () => ({
  calendarService: {
    getAvailableSlots: vi.fn().mockResolvedValue([]),
  },
}))

import { calendarService } from "@/modules/calendar/services/calendar-service"
const mockGetSlots = vi.mocked(calendarService.getAvailableSlots)

const ctx = { params: Promise.resolve({}) }

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/availability")
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url)
}

describe("GET /api/availability", () => {
  beforeEach(() => {
    mockGetSlots.mockResolvedValue([])
  })

  it("devuelve 200 con array vacío cuando no hay slots disponibles", async () => {
    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
    })
    const res = await GET(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it("devuelve 200 con los slots que devuelve el servicio", async () => {
    const slot = {
      startsAt: new Date("2026-07-01T10:00:00Z"),
      endsAt: new Date("2026-07-01T11:00:00Z"),
    }
    mockGetSlots.mockResolvedValue([slot])

    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
    })
    const res = await GET(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].startsAt).toBe(slot.startsAt.toISOString())
  })

  it("llama a calendarService con las fechas correctas", async () => {
    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
    })
    await GET(req, ctx)
    expect(mockGetSlots).toHaveBeenCalledWith(
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-07-08T00:00:00Z")
    )
  })

  it("devuelve 400 si falta el param from", async () => {
    const req = makeRequest({ to: "2026-07-08T00:00:00Z" })
    const res = await GET(req, ctx)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si falta el param to", async () => {
    const req = makeRequest({ from: "2026-07-01T00:00:00Z" })
    const res = await GET(req, ctx)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si from no es una fecha ISO válida", async () => {
    const req = makeRequest({ from: "not-a-date", to: "2026-07-08T00:00:00Z" })
    const res = await GET(req, ctx)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("devuelve 400 si type tiene un valor no soportado", async () => {
    const req = makeRequest({
      from: "2026-07-01T00:00:00Z",
      to: "2026-07-08T00:00:00Z",
      type: "tattoo",
    })
    const res = await GET(req, ctx)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })
})
