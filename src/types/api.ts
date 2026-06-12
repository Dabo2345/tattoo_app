// Formato de respuesta exitosa (API-001)
export type ApiSuccess<T> = {
  success: true
  data: T
}

// Formato de respuesta de error (API-001)
export type ApiError = {
  success: false
  error: {
    code: ApiErrorCode
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// Códigos de error del sistema (API-001)
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SLOT_NOT_AVAILABLE"
  | "PAYMENT_FAILED"
  | "PAYMENT_REQUIRED"
  | "LINK_EXPIRED"
  | "LINK_ALREADY_USED"
  | "REFUND_FAILED"
  | "CONFLICT"
  | "RESCHEDULE_NOT_ALLOWED"
  | "INTERNAL_ERROR"
  | "NOTIFICATION_SEND_ERROR"
  | "INVALID_STATUS"
  | "ALREADY_EXISTS"
  | "ALREADY_CANCELLED"

// Resultado de Server Actions (para componentes)
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
