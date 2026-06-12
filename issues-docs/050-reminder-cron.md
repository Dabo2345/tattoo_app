# ISSUE DOC #050 — Sistema de recordatorios: cron + templates 24h y 2h

## CONTEXTO

El NotificationService (#049) tiene los métodos `sendReminder24h` y `sendReminder2h` pendientes. Esta issue implementa el sistema completo de recordatorios automáticos: los dos templates React Email, los dos métodos en el servicio, el endpoint cron protegido, y la configuración de Vercel Cron Jobs.

## OBJETIVO

Que los clientes reciban automáticamente un recordatorio 24h y otro 2h antes de cada cita CONFIRMED, sin duplicados, sin intervención manual.

## SCOPE

- `src/modules/notification/templates/reminder-24h.tsx` ← NEW
- `src/modules/notification/templates/reminder-2h.tsx` ← NEW
- `src/modules/notification/repositories/notification-repository.ts` ← MODIFIED (add existsByAppointmentAndType)
- `src/modules/notification/services/notification-service.ts` ← MODIFIED (add sendReminder24h, sendReminder2h)
- `src/app/api/cron/send-reminders/route.ts` ← NEW
- `vercel.json` ← NEW
- Tests unitarios para los templates
- Tests de integración para el endpoint cron

## ANTI-SCOPE

- No enviar SMS ni WhatsApp
- No añadir lógica de retry para notificaciones FAILED
- No implementar más tipos de cron

## ARCHIVOS AFECTADOS

```
issues-docs/050-reminder-cron.md                                             ← NEW
src/modules/notification/templates/reminder-24h.tsx                          ← NEW
src/modules/notification/templates/reminder-2h.tsx                           ← NEW
src/modules/notification/repositories/notification-repository.ts             ← MODIFIED
src/modules/notification/services/notification-service.ts                    ← MODIFIED
src/app/api/cron/send-reminders/route.ts                                     ← NEW
vercel.json                                                                  ← NEW
tests/unit/modules/notification/reminder-24h.test.tsx                        ← NEW
tests/unit/modules/notification/reminder-2h.test.tsx                         ← NEW
tests/integration/api/cron-send-reminders.test.ts                           ← NEW
```

## FLUJO DE EJECUCIÓN

```
Vercel Cron (cada 30 min) → POST /api/cron/send-reminders
        ↓
  1. Verificar Bearer CRON_SECRET → 401 si inválido
        ↓
  2. Calcular ventanas de tiempo:
     - 24h: now+23h30m … now+24h30m
     - 2h:  now+1h30m  … now+2h30m
        ↓
  3. Buscar appointments CONFIRMED en cada ventana
        ↓
  4. Para cada appointment:
     - existsByAppointmentAndType(id, REMINDER_Xh) ?
       - Sí → ignorar (idempotente)
       - No → notificationService.sendReminderXh(id)
        ↓
  5. Responder { sent24h, sent2h }
```

## REGLAS DE NEGOCIO

- Solo appointments en estado CONFIRMED reciben recordatorio (NOTIF-001 §7.4)
- Idempotencia: si ya existe Notification de ese tipo (cualquier status) para ese appointment → no enviar
- Sin CRON_SECRET configurado → 503 Service Unavailable
- Bearer incorrecto → 401 Unauthorized
- Los errores de envío individual no abortan el proceso completo (NP-003)

## CRITERIOS DE ACEPTACIÓN

- [ ] Templates `Reminder24hEmail` y `Reminder2hEmail` renderizan HTML con nombre, fecha y hora
- [ ] `notificationRepository.existsByAppointmentAndType` implementado
- [ ] `sendReminder24h` y `sendReminder2h` añadidos al notificationService
- [ ] `POST /api/cron/send-reminders` requiere `Authorization: Bearer CRON_SECRET`
- [ ] Endpoint busca appointments en ventanas correctas (23h30m-24h30m, 1h30m-2h30m)
- [ ] Idempotencia: si notification ya existe, no se reenvía
- [ ] `vercel.json` configurado con `"*/30 * * * *"`
- [ ] Tests unitarios de templates pasando
- [ ] Tests de integración del endpoint pasando

## EDGE CASES

- `CRON_SECRET` no configurado en env → 503
- Appointment ya tiene REMINDER_24H FAILED → no reenviar (MVP)
- Ventanas de 24h y 2h pueden coincidir si la cita es en 2h y también en 24h — imposible, pero la lógica las maneja independientemente

## TESTS REQUERIDOS

| Test | Tipo | Descripción |
|------|------|-------------|
| reminder-24h renderiza nombre | Unit | HTML contiene el nombre del cliente |
| reminder-24h renderiza fecha | Unit | HTML contiene la fecha de la cita |
| reminder-24h renderiza hora | Unit | HTML contiene la hora de la cita |
| reminder-2h renderiza nombre | Unit | HTML contiene el nombre del cliente |
| reminder-2h renderiza hora | Unit | HTML contiene la hora de la cita |
| cron sin CRON_SECRET → 401 | Integration | Sin header devuelve 401 |
| cron con secret incorrecto → 401 | Integration | Bearer inválido devuelve 401 |
| cron envía reminder 24h | Integration | Appointments en ventana 24h reciben recordatorio |
| cron envía reminder 2h | Integration | Appointments en ventana 2h reciben recordatorio |
| cron es idempotente | Integration | No duplica si Notification ya existe |

## DEPENDENCIAS

- #049 — NotificationService ✅

## DEFINITION OF DONE

- [ ] 2 templates implementados
- [ ] `sendReminder24h` y `sendReminder2h` en notificationService
- [ ] Endpoint cron implementado y protegido
- [ ] `vercel.json` configurado
- [ ] Tests unitarios y de integración pasando (10+ tests)
- [ ] TypeScript sin errores
- [ ] CI verde
