import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    studioConfig: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import {
  updateWorkingHoursAction,
  updateBreakTimesAction,
  updateDepositAmountAction,
  STUDIO_CONFIG_ID,
} from "@/app/admin/settings/actions"

const mockGetSession = vi.mocked(auth.api.getSession)
const mockUpsert = vi.mocked(prisma.studioConfig.upsert)
const mockAuditCreate = vi.mocked(prisma.auditLog.create)

const adminSession = { user: { id: "admin-1", email: "admin@example.com" } }

const validWorkingHours = {
  workingStartHour: 10,
  workingStartMinute: 0,
  workingEndHour: 20,
  workingEndMinute: 0,
  slotDurationMinutes: 30,
  consultationDurationMinutes: 60,
}

const BREAK_UUID = "550e8400-e29b-41d4-a716-446655440000"

const validBreaks = {
  breaks: [
    {
      id: BREAK_UUID,
      label: "Pausa comida",
      startHour: 14,
      startMinute: 0,
      endHour: 15,
      endMinute: 0,
    },
  ],
}

const validDeposit = { depositAmount: 50 }

// ─── updateWorkingHoursAction ─────────────────────────────────────────────────

describe("updateWorkingHoursAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockUpsert.mockResolvedValue({} as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await updateWorkingHoursAction(validWorkingHours)
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si workingStartHour >= workingEndHour", async () => {
    const result = await updateWorkingHoursAction({
      ...validWorkingHours,
      workingStartHour: 20,
      workingEndHour: 10,
    })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/inicio.*anterior|anterior.*inicio/i)
  })

  it("retorna error si inicio y fin son iguales", async () => {
    const result = await updateWorkingHoursAction({
      ...validWorkingHours,
      workingStartHour: 10,
      workingStartMinute: 0,
      workingEndHour: 10,
      workingEndMinute: 0,
    })
    expect(result.success).toBe(false)
  })

  it("retorna error si ventana laboral < consultationDurationMinutes", async () => {
    // Ventana de 30min pero consulta de 60min
    const result = await updateWorkingHoursAction({
      ...validWorkingHours,
      workingStartHour: 10,
      workingEndHour: 10,
      workingEndMinute: 30,
      consultationDurationMinutes: 60,
    })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/ventana|duración/i)
  })

  it("retorna success con datos válidos", async () => {
    const result = await updateWorkingHoursAction(validWorkingHours)
    expect(result.success).toBe(true)
  })

  it("llama a upsert con el STUDIO_CONFIG_ID correcto", async () => {
    await updateWorkingHoursAction(validWorkingHours)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: STUDIO_CONFIG_ID } })
    )
  })

  it("crea AuditLog con acción WORKING_HOURS_UPDATED", async () => {
    await updateWorkingHoursAction(validWorkingHours)
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "WORKING_HOURS_UPDATED",
          entityId: STUDIO_CONFIG_ID,
          adminUserId: "admin-1",
        }),
      })
    )
  })
})

// ─── updateBreakTimesAction ───────────────────────────────────────────────────

describe("updateBreakTimesAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockUpsert.mockResolvedValue({} as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await updateBreakTimesAction(validBreaks)
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si un break tiene start >= end", async () => {
    const result = await updateBreakTimesAction({
      breaks: [
        {
          id: BREAK_UUID,
          label: "Pausa",
          startHour: 15,
          startMinute: 0,
          endHour: 14,
          endMinute: 0,
        },
      ],
    })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/inicio.*anterior|anterior.*inicio/i)
  })

  it("retorna error si start y end son iguales en un break", async () => {
    const result = await updateBreakTimesAction({
      breaks: [
        {
          id: BREAK_UUID,
          label: "Pausa",
          startHour: 14,
          startMinute: 0,
          endHour: 14,
          endMinute: 0,
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("retorna success con breaks vacío", async () => {
    const result = await updateBreakTimesAction({ breaks: [] })
    expect(result.success).toBe(true)
  })

  it("retorna success con datos válidos", async () => {
    const result = await updateBreakTimesAction(validBreaks)
    expect(result.success).toBe(true)
  })

  it("llama a upsert con el array de breaks", async () => {
    await updateBreakTimesAction(validBreaks)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: STUDIO_CONFIG_ID },
        update: expect.objectContaining({ breaks: validBreaks.breaks }),
      })
    )
  })

  it("crea AuditLog con acción BREAK_TIMES_UPDATED", async () => {
    await updateBreakTimesAction(validBreaks)
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "BREAK_TIMES_UPDATED",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})

// ─── updateDepositAmountAction ────────────────────────────────────────────────

describe("updateDepositAmountAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetSession.mockResolvedValue(adminSession as never)
    mockUpsert.mockResolvedValue({} as never)
    mockAuditCreate.mockResolvedValue({} as never)
  })

  it("retorna error si no hay sesión", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const result = await updateDepositAmountAction(validDeposit)
    expect(result.success).toBe(false)
    expect(result.error).toBe("No autorizado")
  })

  it("retorna error si el amount es negativo", async () => {
    const result = await updateDepositAmountAction({ depositAmount: -10 })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/negativo/i)
  })

  it("retorna success con amount = 0 (consulta gratuita)", async () => {
    const result = await updateDepositAmountAction({ depositAmount: 0 })
    expect(result.success).toBe(true)
  })

  it("retorna success con datos válidos", async () => {
    const result = await updateDepositAmountAction(validDeposit)
    expect(result.success).toBe(true)
  })

  it("llama a upsert con el depositAmount correcto", async () => {
    await updateDepositAmountAction({ depositAmount: 75 })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: STUDIO_CONFIG_ID },
        update: expect.objectContaining({ depositAmount: 75 }),
      })
    )
  })

  it("crea AuditLog con acción DEPOSIT_AMOUNT_UPDATED", async () => {
    await updateDepositAmountAction(validDeposit)
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "DEPOSIT_AMOUNT_UPDATED",
          adminUserId: "admin-1",
        }),
      })
    )
  })
})
