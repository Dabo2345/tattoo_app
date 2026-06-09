import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/content/profile/route"
import { artistProfile } from "@/modules/content/data/artist-profile"

describe("GET /api/content/profile", () => {
  it("returns 200 with artist profile data", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("response has success:true and data structure", async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it("data matches the static artist profile", async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.data.name).toBe(artistProfile.name)
    expect(body.data.specialties).toEqual(artistProfile.specialties)
    expect(Array.isArray(body.data.specialties)).toBe(true)
  })
})
