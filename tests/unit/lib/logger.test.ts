import { describe, it, expect } from "vitest"
import { logger } from "@/lib/logger"

describe("logger", () => {
  it("existe y tiene los métodos básicos", () => {
    expect(logger.info).toBeDefined()
    expect(logger.error).toBeDefined()
    expect(logger.warn).toBeDefined()
    expect(logger.debug).toBeDefined()
  })

  it("tiene nivel silent en entorno de test", () => {
    expect(logger.level).toBe("silent")
  })
})
