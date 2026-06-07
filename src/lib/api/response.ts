import { NextResponse } from "next/server"
import type { ApiErrorCode, ApiResponse } from "@/types/api"

/**
 * Crea una respuesta de éxito tipada según API-001.
 */
export function createApiResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Crea una respuesta de error tipada según API-001.
 * NUNCA expone detalles internos al cliente.
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  status: number = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
