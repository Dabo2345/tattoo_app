# NOTIF-001 — Sistema de Notificaciones

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-06

---

# 1. Principios

## NP-001

Las notificaciones son exclusivamente por email en el MVP. No se implementará WhatsApp ni SMS sin ADR aprobado.

## NP-002

Resend es el único proveedor de email autorizado. Solo accesible desde el backend.

## NP-003

Toda notificación fallida se loguea y se registra en la base de datos con estado `FAILED`. No lanza excepción que rompa el flujo principal.

## NP-004

Los emails son transaccionales únicamente. Sin emails de marketing en el MVP.

## NP-005

El envío de notificaciones nunca bloquea la respuesta al cliente. Si falla el email, la acción principal (crear reserva, confirmar pago) ya fue completada.

---

# 2. Triggers de notificación

Cada acción del sistema que dispara una notificación según DATA-002 (RB-016, RB-017, RB-018):

| Evento | Destinatario | Notificación | Regla |
|--------|-------------|--------------|-------|
| Consultation CONFIRMED (pago OK) | Cliente | Confirmación de consulta + MagicLink | RB-016 |
| TattooSession CONFIRMED (via SessionLink) | Cliente | Confirmación de sesión de tatuaje | RB-016 |
| Appointment CANCELLED (cliente o admin) | Cliente | Confirmación de cancelación + info depósito | RB-018 |
| Appointment RESCHEDULED | Cliente | Confirmación de reprogramación | RB-017 |
| MagicLink enviado manualmente | Cliente | Email con link de gestión de cita | RB-016 |
| SessionLink generado por admin | Cliente | Email con link para reservar sesión de tatuaje | - |
| Reminder 24h antes de cita | Cliente | Recordatorio con detalles de cita | - |
| Reminder 2h antes de cita | Cliente | Recordatorio final con detalles de cita | - |

---

# 3. Arquitectura del módulo

```
/src/modules/notification/
├── services/
│   ├── notification-service.ts     ← Orquestación principal
│   └── reminder-scheduler.ts       ← Lógica de recordatorios
├── repositories/
│   └── notification-repository.ts  ← CRUD de Notification en DB
├── templates/
│   ├── consultation-confirmed.tsx   ← Template React Email
│   ├── session-confirmed.tsx
│   ├── appointment-cancelled.tsx
│   ├── appointment-rescheduled.tsx
│   ├── magic-link.tsx
│   ├── session-link.tsx
│   ├── reminder-24h.tsx
│   └── reminder-2h.tsx
├── types/
│   └── index.ts                     ← NotificationPayload, NotificationStatus
└── errors.ts
```

---

# 4. Modelo de datos

La entidad `Notification` en la base de datos (definida en DATA-001):

```
Notification {
  id            UUID
  appointmentId UUID (FK → Appointment)
  type          NotificationType
  status        NotificationStatus  ← PENDING | SENT | FAILED
  sentAt        DateTime?
  failedAt      DateTime?
  errorMessage  String?             ← Mensaje de error si status = FAILED
  createdAt     DateTime
  updatedAt     DateTime
}

NotificationType {
  CONSULTATION_CONFIRMED
  SESSION_CONFIRMED
  APPOINTMENT_CANCELLED
  APPOINTMENT_RESCHEDULED
  MAGIC_LINK_SENT
  SESSION_LINK_SENT
  REMINDER_24H
  REMINDER_2H
}
```

---

# 5. NotificationService

## 5.1 API pública del servicio

```typescript
// /src/modules/notification/services/notification-service.ts

export const notificationService = {
  // Enviados por el BookingService tras confirmar pago
  async sendConsultationConfirmed(appointmentId: string): Promise<void>

  // Enviado tras confirmar TattooSession via SessionLink
  async sendSessionConfirmed(appointmentId: string): Promise<void>

  // Enviado tras cancelación (cliente o admin)
  async sendAppointmentCancelled(appointmentId: string): Promise<void>

  // Enviado tras reprogramación
  async sendAppointmentRescheduled(appointmentId: string): Promise<void>

  // Enviado al crear o solicitar nuevo MagicLink
  async sendMagicLink(appointmentId: string, magicLinkToken: string): Promise<void>

  // Enviado al generar SessionLink desde admin
  async sendSessionLink(appointmentId: string, sessionLinkToken: string): Promise<void>

  // Enviados por el sistema de recordatorios
  async sendReminder24h(appointmentId: string): Promise<void>
  async sendReminder2h(appointmentId: string): Promise<void>
}
```

## 5.2 Flujo interno de envío

```
notificationService.sendConsultationConfirmed(appointmentId)
        ↓
  1. Cargar appointment + client desde DB
        ↓
  2. Crear registro Notification { status: PENDING } en DB
        ↓
  3. Renderizar template React Email con los datos
        ↓
  4. Llamar Resend API
        ↓
  Éxito → actualizar Notification { status: SENT, sentAt: now }
  Error → actualizar Notification { status: FAILED, errorMessage, failedAt: now }
          Loguear con Pino (nivel error)
          NO lanzar excepción (el flujo principal ya completó)
```

---

# 6. Templates de email

## 6.1 Stack de plantillas

Los emails se crean con **React Email** (`@react-email/components`).

Esto permite:
- Templates en TSX con componentes React
- Preview visual en desarrollo (`email.dev.ts` o Storybook)
- Renderizado a HTML/texto plano automático

## 6.2 Información obligatoria en cada template

| Template | Contenido obligatorio |
|----------|----------------------|
| `consultation-confirmed` | Nombre cliente, fecha y hora cita, duración, depósito pagado, MagicLink para gestionar |
| `session-confirmed` | Nombre cliente, fecha y hora sesión, duración estimada, dirección estudio |
| `appointment-cancelled` | Nombre cliente, fecha cancelada, política de depósito aplicada (reembolso o retención) |
| `appointment-rescheduled` | Nombre cliente, fecha anterior, nueva fecha, MagicLink actualizado |
| `magic-link` | Nombre cliente, enlace de gestión (válido 2 horas), botones: ver cita, cancelar, reprogramar |
| `session-link` | Nombre cliente, enlace para reservar sesión `{APP_URL}/session-link/{token}` (válido 30 días), instrucciones |
| `reminder-24h` | Nombre cliente, fecha y hora, dirección estudio, instrucciones preparación |
| `reminder-2h` | Nombre cliente, hora cita, dirección estudio |

## 6.3 Zona horaria en el formateo de fechas

**RB-NOTIF-TZ-001:** Todas las fechas y horas mostradas en los emails se formatean en **UTC** (`timeZone: "UTC"`), igual que se almacenan en la base de datos.

- Los appointments se guardan en UTC en la DB
- Las funciones `formatDate()` y `formatTime()` del `NotificationService` usan `timeZone: "UTC"` explícitamente
- Esto evita desfases por cambio de horario de verano/invierno (DST), que causaban una diferencia de +2h con `Europe/Madrid` en CEST

## 6.3 Datos del remitente

- **From**: valor de `RESEND_FROM_NAME` + `RESEND_FROM_EMAIL` (ENV-001)
- **Reply-To**: email del estudio

## 6.4 Reglas de diseño de emails

- HTML + texto plano siempre (algunos clientes de email no renderizan HTML)
- Mobile-first (mayoría de emails se leen en móvil)
- Sin imágenes de fondo (baja compatibilidad)
- Colores alineados con UI-001 (tema oscuro profesional, accent rojo #B91C1C)
- Botón CTA principal claro y visible

---

# 7. Sistema de recordatorios

## 7.1 Lógica de scheduling

Los recordatorios deben enviarse automáticamente:
- **24 horas antes** de cada cita confirmada
- **2 horas antes** de cada cita confirmada

En el MVP, el sistema de recordatorios se implementa como un **cron job en Vercel** (Vercel Cron Jobs — plan free incluye hasta 2 cron jobs).

## 7.2 Cron job

```
Frecuencia: cada 30 minutos

Endpoint: POST /api/cron/send-reminders
Autenticado con: header Authorization: Bearer CRON_SECRET

Lógica:
  1. Buscar appointments CONFIRMED cuyo startsAt sea entre:
     - now + 23h30m y now + 24h30m (ventana de 1h para recordatorio 24h)
     - now + 1h30m y now + 2h30m (ventana de 1h para recordatorio 2h)
  2. Para cada appointment encontrado:
     - Verificar que no se envió ya ese recordatorio (buscar Notification existente)
     - Si no existe → enviar y registrar
     - Si existe → ignorar (idempotente)
```

## 7.3 Variable adicional requerida

```bash
# En .env.local y GitHub Secrets
CRON_SECRET="valor-secreto-para-autenticar-cron"
```

## 7.4 Appointments que reciben recordatorio

Solo appointments en estado `CONFIRMED`. No enviar recordatorios a:
- `PENDING_PAYMENT`
- `CANCELLED`
- `COMPLETED`
- `NO_SHOW`

---

# 8. Integración con Resend

## 8.1 Cliente Resend

```typescript
// /src/lib/resend/client.ts
import { Resend } from "resend"
import { env } from "@/lib/env"

export const resend = new Resend(env.RESEND_API_KEY)
```

## 8.2 Función de envío

```typescript
// Ejemplo de estructura
async function sendEmail({
  to,
  subject,
  react,
  text,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      react,
      text,
    })
    return { success: true }
  } catch (error) {
    logger.error({ error, to, subject }, "Failed to send email via Resend")
    return { success: false, error: String(error) }
  }
}
```

---

# 9. Rate limiting y protección

- Máximo 5 peticiones de MagicLink por hora por email (definido en API-001)
- El envío de recordatorios es idempotente para evitar duplicados
- Los errores de Resend no rompen el flujo principal de la aplicación

---

# 10. Testing del sistema de notificaciones

## 10.1 Mocking en tests

En los tests se mockea Resend con MSW (Mock Service Worker) para:
- No enviar emails reales durante los tests
- Verificar que se llamó a Resend con los parámetros correctos
- Simular fallos de Resend para probar el manejo de errores

## 10.2 Tests requeridos

| Test | Tipo | Descripción |
|------|------|-------------|
| Consultation confirmed dispara email | Integration | El NotificationService llama a Resend con datos correctos |
| Fallo de Resend no rompe el flujo | Unit | Si Resend falla, el appointment sigue CONFIRMED |
| Notification queda en estado FAILED | Integration | El registro en DB refleja el fallo |
| Recordatorio no se duplica | Integration | Idempotencia del cron job |
| Template renderiza correctamente | Unit | El HTML generado contiene los datos esperados |
| MagicLink en email es válido | Integration | El token del email funciona para validar |

---

# 11. Observabilidad

## Métricas a monitorizar

- Tasa de éxito/fallo de envíos por tipo de notificación
- Tiempo de envío de recordatorios (¿llegan a tiempo?)
- Número de Notifications en estado FAILED acumuladas

## Alertas

- Si más de 5 Notifications fallan en 1 hora → alerta en Sentry
- Si el cron job de recordatorios falla → Sentry captura el error

---

# 12. Evolución futura (fuera del MVP)

Los siguientes canales están fuera del scope del MVP:

- WhatsApp Business API
- SMS via Twilio o similar
- Push notifications
- Emails de marketing/newsletter

Cualquier incorporación requiere ADR aprobado.
