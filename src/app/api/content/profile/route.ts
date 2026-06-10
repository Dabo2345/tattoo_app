import { NextResponse } from "next/server"
import { artistProfile } from "@/modules/content/data/artist-profile"

export async function GET() {
  return NextResponse.json({ success: true, data: artistProfile })
}
