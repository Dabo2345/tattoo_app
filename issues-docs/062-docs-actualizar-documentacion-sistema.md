# ISSUE DOC #062 — Docs: actualizar /docs/ para reflejar el estado real del sistema

## CONTEXTO

Los documentos en `/docs/` fueron escritos como especificaciones **antes** de la implementación. Después de 62 issues implementadas, estos documentos tienen secciones desactualizadas o incompletas respecto al sistema real en producción.

**Problema**: Un desarrollador nuevo que lea `/docs/` podría tener una imagen incorrecta del sistema. Por ejemplo:
- `API-001` puede no documentar todos los endpoints implementados
- `BACK-001` puede no mencionar módulos como `notification`, `audit`, `payment`
- `NOTIF-001` puede no reflejar los 8 métodos reales del NotificationService
- `ENV-001` puede no incluir `CRON_SECRET` y otras vars añadidas recientemente

Este issue establece el baseline de documentación actualizada que servirá de referencia para todas las issues futuras.

## OBJETIVO

Revisar y actualizar 5 documentos clave para que reflejen el estado real del sistema implementado. No se trata de reescribir desde cero, sino de añadir lo que falta y corregir lo que ha cambiado.

## SCOPE

### 1. API-001 — Contratos de API
Verificar que todos los endpoints implementados están documentados:
- `POST /api/consultations` (o `/api/bookings`)
- `GET /api/availability`
- `POST /api/appointments/:id/cancel`
- `POST /api/appointments/:id/reschedule`
- `POST /api/magic-links/request`
- `GET /api/magic-links/:token`
- `POST /api/magic-links/:token/redeem` (si existe)
- `POST /api/webhooks/stripe`
- `POST /api/cron/send-reminders`
- Todos los endpoints `/api/admin/*`

Para cada endpoint verificar: método, ruta, auth requerida, request body, response, errores posibles.

### 2. BACK-001 — Arquitectura Backend
Añadir descripción de módulos implementados que no estaban en la spec:
- `modules/notification/` — NotificationService, templates, repository
- `modules/audit/` — AuditService
- `modules/payment/` — DepositPolicyService, PaymentRepository
- `lib/api/` — middleware, response helpers, error classes

### 3. DATA-002 — Reglas de Negocio
Confirmar y completar las reglas implementadas:
- RB-013: Cancelación ≥4 días → reembolso automático (verificar que dice "días completos con Math.floor")
- RB-014: Cancelación <4 días → retención
- RB-015: Reprogramación <4 días equivale a cancelación tardía
- Reglas de cron de recordatorios (ventanas de 23.5h-24.5h y 1.5h-2.5h)
- Regla de idempotencia del cron (no enviar si ya existe notificación del mismo tipo)

### 4. NOTIF-001 — Sistema de Notificaciones
Documentar el sistema real implementado:
- Los 8 métodos del NotificationService: `sendConsultationConfirmed`, `sendSessionConfirmed`, `sendAppointmentCancelled`, `sendAppointmentRescheduled`, `sendMagicLink`, `sendSessionLink`, `sendReminder24h`, `sendReminder2h`
- Cuándo se llama cada uno y desde dónde
- El sistema de Notification records (PENDING → SENT/FAILED)
- El cron endpoint `/api/cron/send-reminders` y su lógica
- Templates de React Email disponibles

### 5. ENV-001 — Variables de Entorno
Verificar que todas las variables usadas en el código están documentadas:
- `CRON_SECRET` (añadido en #050, puede no estar en ENV-001)
- `NEXT_PUBLIC_APP_URL` (usado en notification-service para construir URLs)
- Todas las vars de Stripe, Resend, Supabase, Better Auth

## ANTI-SCOPE

- No cambiar la arquitectura del sistema
- No reescribir documentos completos
- No documentar decisions que no se hayan implementado

## ARCHIVOS AFECTADOS

```
docs/Documento 05 — API-001 ...                  ← UPDATE
docs/Documento 15 — BACK-001 ...                 ← UPDATE
docs/Documento 04 — DATA-002 ...                 ← UPDATE
docs/Documento 16 — NOTIF-001 ...                ← UPDATE
docs/Documento 17 — ENV-001 ...                  ← UPDATE
issues-docs/062-docs-actualizar-documentacion-sistema.md ← NEW
```

## FLUJO DE EJECUCIÓN

Para cada documento:
1. Leer el documento actual completo
2. Leer los archivos de código implementado correspondientes
3. Identificar diferencias entre doc y código
4. Añadir/corregir secciones — NO borrar secciones existentes si son válidas
5. Marcar cada sección actualizada con "Actualizado: 2026-06-XX"

## CRITERIOS DE ACEPTACIÓN

- [ ] API-001 lista todos los endpoints con sus contratos actuales
- [ ] BACK-001 menciona los módulos notification, audit, payment
- [ ] DATA-002 especifica "días completos (Math.floor)" en RB-013/RB-014
- [ ] NOTIF-001 documenta los 8 métodos del NotificationService
- [ ] ENV-001 incluye CRON_SECRET y NEXT_PUBLIC_APP_URL

## TESTS REQUERIDOS

No aplica (documentación).

## DOCUMENTACIÓN AFECTADA

Este issue ES la documentación. Al cerrarlo, los 5 docs quedan actualizados.

## DEPENDENCIAS

- Recomendado después de #053-#061 (para que los docs reflejen el estado final correcto)
- Puede ejecutarse en paralelo si se divide por documento

## DEFINITION OF DONE

- [ ] Los 5 documentos revisados y actualizados
- [ ] Cada endpoint implementado aparece en API-001
- [ ] NotificationService completo en NOTIF-001
- [ ] CRON_SECRET en ENV-001
- [ ] PR mergeado a develop
