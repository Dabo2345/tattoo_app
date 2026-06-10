import { NextResponse } from "next/server"
import { studioInfo } from "@/modules/content/data/studio-info"

export async function GET() {
  return NextResponse.json({ success: true, data: studioInfo })
}
