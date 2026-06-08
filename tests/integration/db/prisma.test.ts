import { describe, it, expect, afterAll } from "vitest"
import { prisma } from "@/lib/db/prisma"

describe("Prisma singleton", () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("el singleton no crea múltiples instancias", async () => {
    const { prisma: prisma2 } = await import("@/lib/db/prisma")
    expect(prisma).toBe(prisma2)
  })
})
