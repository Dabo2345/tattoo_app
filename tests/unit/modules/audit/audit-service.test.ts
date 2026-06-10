import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/modules/audit/repositories/audit-repository", () => ({
  auditRepository: {
    create: vi.fn(),
  },
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { auditRepository } from "@/modules/audit/repositories/audit-repository"
import { auditService } from "@/modules/audit/services/audit-service"
import { logger } from "@/lib/logger"

const mockCreate = vi.mocked(auditRepository.create)
const mockLogError = vi.mocked(logger.error)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auditService.log", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({} as never)
  })

  it("escribe en auditRepository con action y entityId", async () => {
    await auditService.log("CONSULTATION_CREATED", "appt-001")

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CONSULTATION_CREATED",
        entityId: "appt-001",
      })
    )
  })

  it("pasa todas las opciones al repositorio", async () => {
    await auditService.log("APPOINTMENT_CANCELLED", "appt-001", {
      entityType: "Appointment",
      clientId: "client-001",
      adminUserId: "admin-001",
      metadata: { refunded: true },
    })

    expect(mockCreate).toHaveBeenCalledWith({
      action: "APPOINTMENT_CANCELLED",
      entityId: "appt-001",
      entityType: "Appointment",
      clientId: "client-001",
      adminUserId: "admin-001",
      metadata: { refunded: true },
    })
  })

  it("funciona sin entityId ni opciones", async () => {
    await auditService.log("SYSTEM_STARTUP")

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ action: "SYSTEM_STARTUP" }))
  })

  it("no lanza error si el repositorio falla — loguea el error", async () => {
    mockCreate.mockRejectedValue(new Error("DB connection lost"))

    await expect(auditService.log("DEPOSIT_RETAINED", "appt-001")).resolves.toBeUndefined()

    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DEPOSIT_RETAINED" }),
      expect.any(String)
    )
  })

  it("devuelve undefined (void) siempre", async () => {
    const result = await auditService.log("DEPOSIT_REFUNDED", "appt-001")
    expect(result).toBeUndefined()
  })
})
