import type { ApiErrorCode } from "@/types/api"

/**
 * Error base del dominio. Todos los errores de negocio extienden esta clase.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = "DomainError"
  }
}

// ─── Errores de Booking ───────────────────────────────────────────────────────

export class SlotNotAvailableError extends DomainError {
  constructor() {
    super("SLOT_NOT_AVAILABLE", "El horario seleccionado ya no está disponible", 409)
    this.name = "SlotNotAvailableError"
  }
}

export class AppointmentNotFoundError extends DomainError {
  constructor() {
    super("NOT_FOUND", "La cita no existe", 404)
    this.name = "AppointmentNotFoundError"
  }
}

// ─── Errores de Links ─────────────────────────────────────────────────────────

export class LinkExpiredError extends DomainError {
  constructor() {
    super("LINK_EXPIRED", "El enlace ha expirado", 410)
    this.name = "LinkExpiredError"
  }
}

export class LinkAlreadyUsedError extends DomainError {
  constructor() {
    super("LINK_ALREADY_USED", "El enlace ya ha sido utilizado", 410)
    this.name = "LinkAlreadyUsedError"
  }
}

export class LinkNotFoundError extends DomainError {
  constructor() {
    super("LINK_EXPIRED", "El enlace no existe o ha expirado", 410)
    this.name = "LinkNotFoundError"
  }
}

// ─── Errores de Autenticación ─────────────────────────────────────────────────

export class UnauthorizedError extends DomainError {
  constructor() {
    super("UNAUTHORIZED", "No autorizado", 401)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends DomainError {
  constructor() {
    super("FORBIDDEN", "Sin permisos para esta acción", 403)
    this.name = "ForbiddenError"
  }
}

// ─── Errores de Pago ──────────────────────────────────────────────────────────

export class PaymentFailedError extends DomainError {
  constructor(message = "El pago no pudo procesarse") {
    super("PAYMENT_FAILED", message, 402)
    this.name = "PaymentFailedError"
  }
}

export class RefundFailedError extends DomainError {
  constructor() {
    super("REFUND_FAILED", "No se pudo procesar el reembolso", 500)
    this.name = "RefundFailedError"
  }
}

export class RescheduleNotAllowedError extends DomainError {
  constructor() {
    super(
      "RESCHEDULE_NOT_ALLOWED",
      "No se puede reprogramar con menos de 4 días de antelación",
      409
    )
    this.name = "RescheduleNotAllowedError"
  }
}

// ─── Errores de TattooPlan ────────────────────────────────────────────────────

export class TattooPlanNotFoundError extends DomainError {
  constructor() {
    super("NOT_FOUND", "El plan de tatuaje no existe", 404)
    this.name = "TattooPlanNotFoundError"
  }
}

export class TattooPlanAlreadyExistsError extends DomainError {
  constructor() {
    super("ALREADY_EXISTS", "Ya existe un plan para esta consulta", 409)
    this.name = "TattooPlanAlreadyExistsError"
  }
}

export class TattooPlanInvalidStatusError extends DomainError {
  constructor(message = "El plan no se puede modificar en su estado actual") {
    super("INVALID_STATUS", message, 422)
    this.name = "TattooPlanInvalidStatusError"
  }
}

export class AppointmentInvalidForPlanError extends DomainError {
  constructor(message = "La cita debe ser de tipo CONSULTATION y estar CONFIRMED") {
    super("INVALID_STATUS", message, 422)
    this.name = "AppointmentInvalidForPlanError"
  }
}

// ─── Error interno genérico ───────────────────────────────────────────────────

export class InternalError extends DomainError {
  constructor(message = "Error interno del servidor") {
    super("INTERNAL_ERROR", message, 500)
    this.name = "InternalError"
  }
}
