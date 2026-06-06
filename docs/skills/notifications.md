# Skill: notifications

## Propósito

Guía de referencia rápida para implementar o modificar el sistema de notificaciones.

---

## Stack

- **Proveedor**: Resend
- **Templates**: React Email (`@react-email/components`)
- **Módulo**: `/src/modules/notification/`
- **Config**: ENV-001 (RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME)

---

## Triggers disponibles

Llamar desde BookingService o CalendarService, nunca desde el frontend:

```typescript
await notificationService.sendConsultationConfirmed(appointmentId)
await notificationService.sendSessionConfirmed(appointmentId)
await notificationService.sendAppointmentCancelled(appointmentId)
await notificationService.sendAppointmentRescheduled(appointmentId)
await notificationService.sendMagicLink(appointmentId, token)
await notificationService.sendSessionLink(appointmentId, token)
await notificationService.sendReminder24h(appointmentId)
await notificationService.sendReminder2h(appointmentId)
```

---

## Reglas críticas

- Resend solo desde backend (nunca desde cliente)
- Los fallos de email NO rompen el flujo principal
- Registrar toda notificación en DB (estado PENDING → SENT | FAILED)
- Los recordatorios son idempotentes (verificar si ya se envió antes de enviar)
- Ver NOTIF-001 para la arquitectura completa

---

## Añadir un nuevo template

1. Crear archivo en `/src/modules/notification/templates/[nombre].tsx`
2. Usar componentes de `@react-email/components`
3. Añadir método en `notification-service.ts`
4. Añadir tipo en `NotificationType` enum (Prisma schema)
5. Añadir tests en `/tests/integration/notification/`

---

## Testing

Mockear Resend con MSW. Nunca enviar emails reales en tests.

Verificar:
- El servicio llama a Resend con los parámetros correctos
- Si Resend falla, el appointment no queda en estado erróneo
- El registro en DB refleja el estado correcto (SENT o FAILED)
