# API-001 — Diseño de APIs y Contratos

## Estado

Aprobado

## Versión

1.0

---

# 1. Principios

## API-001

Todas las entradas serán validadas mediante Zod.

---

## API-002

Toda API devolverá respuestas tipadas.

---

## API-003

No se expondrán errores internos.

---

## API-004

Las APIs públicas utilizarán REST.

---

## API-005

El panel interno utilizará preferentemente Server Actions.

---

# 2. Convención de Respuestas

## Éxito

{
success: true,
data: {}
}

---

## Error

{
success: false,
error: {
code: "SLOT_NOT_AVAILABLE",
message: "El horario ya no está disponible"
}
}

---

# 3. Códigos de Error

VALIDATION_ERROR

UNAUTHORIZED

FORBIDDEN

NOT_FOUND

SLOT_NOT_AVAILABLE

PAYMENT_FAILED

PAYMENT_REQUIRED

LINK_EXPIRED

LINK_ALREADY_USED

REFUND_FAILED

CONFLICT

INTERNAL_ERROR

---

# 4. Booking APIs

## Obtener slots disponibles

GET

/api/availability

Query

from

to

type

---

Respuesta

200

[
{
startsAt,
endsAt
}
]

---

## Crear Consultation

POST

/api/consultations

---

Body

{
name,
email,
phone,
tattooDescription
}

---

Resultado

Appointment

status:

CONFIRMED

(RB-NEW-001: confirmación directa, sin pago previo)

---

Respuesta

201

{
appointmentId,
status: "CONFIRMED"
}

---

## Confirmación Stripe

POST

/api/webhooks/stripe

Uso exclusivo backend.

---

## Cancelar cita

POST

/api/appointments/:id/cancel

Body: `{ magicLinkToken: string }`

Aplica política de depósito (RB-013/014). `refundAmount` refleja el importe real del registro `Payment` en DB — no un valor calculado ni hardcodeado.

Respuesta 200: `{ cancelled: true, refunded: boolean, refundAmount: number }`

- `refundAmount` > 0 solo cuando `refunded: true`; proviene de `Payment.amount`
- `refundAmount = 0` si no hay reembolso o si no existe Payment en DB

---

## Reprogramar cita

POST

/api/appointments/:id/reschedule

---

Body

{
newStartAt
}

---

# 5. Session Links

## Crear SessionLink

POST

/api/admin/session-links

---

Body

{
consultationId,
durationMinutes,
notes
}

---

Respuesta

{
sessionLink
}

---

## Validar SessionLink

GET

/api/session-links/:token

---

Respuesta

{
valid,
expiresAt,
durationMinutes
}

---

## Reservar Tattoo Session

POST

/api/session-links/:token/book

---

Body

{
startAt
}

---

Resultado

TattooSession CONFIRMED

---

# 6. Magic Links

## Solicitar nuevo MagicLink

POST

/api/magic-links/request

---

Body

{
email
}

---

Respuesta

200

{
success: true
}

---

## Validar MagicLink

GET

/api/magic-links/:token

---

Validaciones

Token existente.

Token válido.

expiresAt > currentDate.

---

Respuesta

200

{
appointment
}

---

Respuesta error

410

{
success: false,
error: {
code: "LINK_EXPIRED",
message: "El enlace ha expirado"
}
}

---

Reglas

El MagicLink podrá utilizarse múltiples veces mientras no haya expirado.

No existe el concepto de enlace consumido.

La expiración es el único mecanismo de invalidación.


# 7. Gallery APIs

## Obtener galería

GET

/api/gallery

---

Filtros

styleTag

---

## Obtener imagen

GET

/api/gallery/:id

---

# 8. Content APIs

## Perfil artista

GET

/api/content/profile

Respuesta: `{ success: true, data: { artistProfile } }`

---

## Información estudio

GET

/api/content/studio

Respuesta: `{ success: true, data: { studioInfo } }`

> Nota: No existe `/api/content/home`. La página Home carga datos directamente desde
> la base de datos en el Server Component, sin pasar por una API Route.

---

# 9. Admin APIs

Protegidas por Better Auth (`withAdminAuth`).

---

## Obtener agenda semanal

GET

/api/admin/calendar

Query: `week` (ISO date de inicio de semana)

Respuesta: `{ success: true, data: { appointments[] } }`

---

## Obtener citas

GET

/api/admin/appointments

Query: `status`, `from`, `to` (opcionales)

Respuesta: `{ success: true, data: { appointments[] } }`

---

## Cancelar cita (admin)

POST

/api/admin/appointments/:id/cancel

Respuesta: `{ success: true, data: { appointment } }`

---

## Reprogramar cita (admin)

POST

/api/admin/appointments/:id/reschedule

Body: `{ newStartAt }`

Respuesta: `{ success: true, data: { appointment } }`

---

## Bloquear periodo

POST

/api/admin/blocked-periods

Body: `{ startsAt, endsAt, reason? }`

Respuesta: `{ success: true, data: { blockedPeriod } }`

---

## Eliminar periodo bloqueado

DELETE

/api/admin/blocked-periods/:id

Respuesta: `{ success: true }`

---

# 10. Cron APIs

## Enviar recordatorios automáticos

POST

/api/cron/send-reminders

Auth: `Authorization: Bearer CRON_SECRET`

Sin body. Busca appointments CONFIRMED en ventanas de 24h y 2h y envía recordatorios.

Respuesta: `{ success: true, data: { sent24h, sent2h } }`

Configurado en `vercel.json` para ejecutarse cada 30 minutos.

---

# 11. Uploads

Server Action

uploadGalleryImageAction()

---

Server Action

deleteGalleryImageAction()

---

Server Action

reorderGalleryAction()

---

# 12. Perfil

Server Action

updateArtistProfileAction()

---

Server Action

updateStudioInfoAction()

---

# 13. Configuración

Server Action

updateWorkingHoursAction()

---

Server Action

updateBreakTimesAction()

---

Server Action

updateDepositAmountAction()

---

# 14. Seguridad

Todas las APIs admin:

Authenticated

Authorized

Audit Logged

---

# 15. Rate Limiting

Magic Links

5 peticiones por hora

---

Session Links

20 peticiones por hora

---

Login

5 intentos

15 minutos bloqueo

---

# 16. Versionado

Versión inicial

v1

---

Formato

/api/v1/*
