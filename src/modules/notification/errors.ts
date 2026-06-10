import { DomainError } from "@/lib/api/errors"

export class NotificationSendError extends DomainError {
  constructor(reason: string) {
    super("NOTIFICATION_SEND_ERROR", `Error al enviar notificación: ${reason}`, 500)
  }
}
