import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

const ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"

export async function GET() {
  const profile = await prisma.artistProfile.findUnique({
    where: { id: ARTIST_PROFILE_ID },
  })

  if (!profile) {
    return NextResponse.json({ success: false, error: "Perfil no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: profile })
}
