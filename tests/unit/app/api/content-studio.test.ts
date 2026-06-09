import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/content/studio/route"
import { studioInfo } from "@/modules/content/data/studio-info"

describe("GET /api/content/studio", () => {
  it("returns 200 with studio info", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("response has success:true and data structure", async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it("data matches the static studio info", async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.data.name).toBe(studioInfo.name)
    expect(body.data.address).toBe(studioInfo.address)
    expect(Array.isArray(body.data.workingHours)).toBe(true)
  })
})
