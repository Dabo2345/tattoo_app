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

PENDING_PAYMENT

---

Respuesta

201

{
appointmentId,
stripeCheckoutUrl
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

Requiere `magicLinkToken` en el body. Aplica política de depósito (RB-013/014) y envía email de cancelación al cliente.

Body: `{ magicLinkToken: string }`

Respuesta 200: `{ cancelled: true, refunded: boolean, refundAmount: number }`

---

## Reprogramar cita

POST

/api/appointments/:id/reschedule

Requiere `magicLinkToken` y `newStartAt` en el body. Solo permitido con ≥4 días de antelación (RB-015). Envía email de reprogramación al cliente con la fecha anterior y la nueva.

Body: `{ magicLinkToken: string, newStartAt: string (ISO 8601) }`

Respuesta 200: `{ rescheduled: true, newStartAt: string, newEndsAt: string }`

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

## Página Home

GET

/api/content/home

---

## Perfil artista

GET

/api/content/profile

---

## Información estudio

GET

/api/content/studio

---

# 9. Admin APIs

Protegidas por Better Auth.

---

## Obtener agenda

GET

/ api/admin/calendar

---

## Bloquear periodo

POST

/api/admin/blocked-periods

---

## Obtener citas

GET

/api/admin/appointments

---

## Cancelar cita

POST

/api/admin/appointments/:id/cancel

Cancela una cita y ejecuta la política de depósito (RB-013/014).

**Comportamiento:**
- Si `startsAt` es ≥4 días desde ahora → reembolso automático vía Stripe (`refunded: true`, incluye `stripeRefundId`)
- Si `startsAt` es <4 días desde ahora → depósito retenido (`refunded: false`)
- Si el appointment ya está CANCELLED/COMPLETED/NO_SHOW → 409

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "appointment": { "id": "string", "status": "CANCELLED" },
    "refunded": true,
    "stripeRefundId": "re_xxx"
  }
}
```

**Nota:** `stripeRefundId` solo aparece cuando `refunded: true`.

---

## Reprogramar cita

POST

/api/admin/appointments/:id/reschedule

---

# 10. Uploads

Server Action

uploadGalleryImageAction()

---

Server Action

deleteGalleryImageAction()

---

Server Action

reorderGalleryAction()

---

# 11. Perfil

Server Action

updateArtistProfileAction()

---

Server Action

updateStudioInfoAction()

---

# 12. Configuración

Server Action

updateWorkingHoursAction()

---

Server Action

updateBreakTimesAction()

---

Server Action

updateDepositAmountAction()

---

# 13. Seguridad

Todas las APIs admin:

Authenticated

Authorized

Audit Logged

---

# 14. Rate Limiting

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

# 15. Versionado

Versión inicial

v1

---

Formato

/api/v1/*
