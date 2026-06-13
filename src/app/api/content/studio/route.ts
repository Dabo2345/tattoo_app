import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

const STUDIO_INFO_ID = "00000000-0000-0000-0000-000000000002"

export async function GET() {
  const studio = await prisma.studioInfo.findUnique({
    where: { id: STUDIO_INFO_ID },
  })

  if (!studio) {
    return NextResponse.json(
      { success: false, error: "Información del estudio no encontrada" },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: studio })
}
