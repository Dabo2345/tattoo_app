import { NextRequest, NextResponse } from "next/server"
import { galleryRepository } from "@/modules/gallery/repositories/gallery-repository"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get("tag") ?? undefined

    const images = await galleryRepository.findAll(tag)

    return NextResponse.json({ success: true, data: images })
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al obtener la galería" },
      { status: 500 }
    )
  }
}
