import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/admin/blocked-periods/route"
import { DELETE } from "@/app/api/admin/blocked-periods/[id]/route"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  withAdminAuth: vi.fn(async (_req: Request, handler: (s: unknown) => Promise<Response>) =>
    handler({ user: { id: "admin-1", email: "admin@example.com" } })
  ),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    blockedPeriod: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

import { withAdminAuth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const mockFindMany = vi.mocked(prisma.blockedPeriod.findMany)
const mockFindFirst = vi.mocked(prisma.blockedPeriod.findFirst)
const mockCreate = vi.mocked(prisma.blockedPeriod.create)
const mockDelete = vi.mocked(prisma.blockedPeriod.delete)
const mockAuditCreate = vi.mocked(prisma.auditLog.create)
const mockWithAdminAuth = vi.mocked(withAdminAuth)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const STARTS_AT = "2026-07-20T10:00:00.000Z"
const ENDS_AT = "2026-07-20T20:00:00.000Z"

const blockedPeriod = {
  id: "bp-1",
  startsAt: new Date(STARTS_AT),
  endsAt: new Date(ENDS_AT),
  reason: "Vacaciones",
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/admin/blocked-periods")
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url.toString())
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/blocked-periods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest() {
  return new Request("http://localhost:3000/api/admin/blocked-periods/bp-1", {
    method: "DELETE",
  })
}

const deleteParams = Promise.resolve({ id: "bp-1" })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/admin/blocked-periods", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFindMany.mockResolvedValue([])
    mockCreate.mockResolvedValue(blockedPeriod as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it("retorna 200 con lista vacía si no hay períodos", async () => {
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.blockedPeriods).toEqual([])
  })

  it("retorna 200 con los períodos mapeados al contrato", async () => {
    mockFindMany.mockResolvedValueOnce([blockedPeriod] as never)
    const res = await GET(makeGetRequest())
    const body = await res.json()
    expect(body.data.blockedPeriods).toHaveLength(1)
    const p = body.data.blockedPeriods[0]
    expect(p.id).toBe("bp-1")
    expect(p.startsAt).toBe(STARTS_AT)
    expect(p.endsAt).toBe(ENDS_AT)
    expect(p.reason).toBe("Vacaciones")
  })
})

describe("POST /api/admin/blocked-periods", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockCreate.mockResolvedValue(blockedPeriod as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )
    const res = await POST(makePostRequest({ startsAt: STARTS_AT, endsAt: ENDS_AT }))
    expect(res.status).toBe(401)
  })

  it("retorna 400 si el body es inválido", async () => {
    const res = await POST(makePostRequest({ startsAt: "not-a-date", endsAt: ENDS_AT }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 400 si startsAt >= endsAt", async () => {
    const res = await POST(makePostRequest({ startsAt: ENDS_AT, endsAt: STARTS_AT }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("retorna 200 y crea el período con los datos correctos", async () => {
    const res = await POST(
      makePostRequest({ startsAt: STARTS_AT, endsAt: ENDS_AT, reason: "Vacaciones" })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.blockedPeriod.id).toBe("bp-1")
    expect(body.data.blockedPeriod.startsAt).toBe(STARTS_AT)
    expect(body.data.blockedPeriod.endsAt).toBe(ENDS_AT)
  })

  it("llama a prisma.blockedPeriod.create con los valores correctos", async () => {
    await POST(makePostRequest({ startsAt: STARTS_AT, endsAt: ENDS_AT }))
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        startsAt: new Date(STARTS_AT),
        endsAt: new Date(ENDS_AT),
        reason: null,
      },
    })
  })

  it("crea un AuditLog con acción BLOCKED_PERIOD_CREATED", async () => {
    await POST(makePostRequest({ startsAt: STARTS_AT, endsAt: ENDS_AT }))
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "BLOCKED_PERIOD_CREATED",
          entityId: "bp-1",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})

describe("DELETE /api/admin/blocked-periods/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockDelete.mockResolvedValue(blockedPeriod as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna 401 si no hay sesión admin", async () => {
    mockWithAdminAuth.mockResolvedValueOnce(
      Response.json({ success: false, error: "No autorizado" }, { status: 401 })
    )
    const res = await DELETE(makeDeleteRequest(), { params: deleteParams })
    expect(res.status).toBe(401)
  })

  it("retorna 404 si el período no existe", async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const res = await DELETE(makeDeleteRequest(), { params: deleteParams })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("retorna 200 y devuelve el id eliminado", async () => {
    mockFindFirst.mockResolvedValueOnce(blockedPeriod as never)
    const res = await DELETE(makeDeleteRequest(), { params: deleteParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe("bp-1")
  })

  it("crea un AuditLog con acción BLOCKED_PERIOD_DELETED", async () => {
    mockFindFirst.mockResolvedValueOnce(blockedPeriod as never)
    await DELETE(makeDeleteRequest(), { params: deleteParams })
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "BLOCKED_PERIOD_DELETED",
          entityId: "bp-1",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})
