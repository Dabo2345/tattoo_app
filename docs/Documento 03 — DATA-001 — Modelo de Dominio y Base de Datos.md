# DATA-001 — Modelo de Dominio y Base de Datos

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-02

---

# 1. Objetivo

Definir:

* Entidades del dominio.
* Relaciones.
* Estados.
* Restricciones.
* Convenciones de persistencia.

---

# 2. Principios

## DP-001

Toda entidad deberá tener:

* id
* createdAt
* updatedAt

---

## DP-002

Las claves primarias serán UUID.

---

## DP-003

No se realizarán borrados físicos salvo requisitos RGPD.

Por defecto:

Soft Delete.

---

## DP-004

Las fechas se almacenarán en UTC.

---

# 3. Entidades principales

Client

Appointment

SessionLink

MagicLink

Payment

Refund

BlockedPeriod

GalleryImage

StyleTag

Notification

AdminUser

AuditLog

TattooPlan

TattooPlanSession

---

# 4. Enumeraciones

AppointmentType

CONSULTATION

TATTOO_SESSION

---

AppointmentStatus

PENDING

CONFIRMED

CANCELLED

COMPLETED

NO_SHOW

---

PaymentStatus

PENDING

PAID

FAILED

REFUNDED

---

NotificationStatus

PENDING

SENT

FAILED

---

MagicLinkPurpose

MANAGE_APPOINTMENT

---

TattooPlanStatus

DRAFT

SENT

IN_PROGRESS

COMPLETED

---

TattooPlanSessionStatus

PENDING

LINK_SENT

BOOKED

COMPLETED

---

# 5. Entidad Client

Representa a un cliente.

---

Campos

id

name

email

phone

createdAt

updatedAt

deletedAt

---

Restricciones

email único

phone único

---

Relaciones

1 Client

N Appointments

---

# 6. Entidad Appointment

Representa cualquier cita del sistema.

---

Campos

id

clientId

type

status

startsAt

endsAt

notes

depositRequired

depositAmount

createdAt

updatedAt

deletedAt

---

Restricciones

startsAt < endsAt

---

Relaciones

N Appointment

1 Client

---

1 Appointment

0..1 Payment

---

1 Appointment

N MagicLinks

---

1 Appointment

0..1 SessionLink

---

1 Appointment (CONSULTATION)

0..1 TattooPlan

---

# 7. Entidad SessionLink

Permite reservar una Tattoo Session.

---

Campos

id

appointmentId

token

expiresAt

usedAt

sessionDurationMinutes

artistNotes

createdAt

updatedAt

---

Restricciones

token único

---

Reglas

Un SessionLink solo puede utilizarse una vez.

---

# 8. Entidad MagicLink

Permite al cliente gestionar una cita sin necesidad de crear una cuenta.

---

Campos

id

appointmentId

token

expiresAt

purpose

createdAt

updatedAt

---

Restricciones

token único

---

Reglas

Validez máxima:

2 horas

---

El enlace podrá utilizarse múltiples veces mientras:

currentDate < expiresAt

---

Una vez expirado:

El cliente deberá solicitar un nuevo MagicLink.

---

Relaciones

N MagicLinks

1 Appointment


# 9. Entidad Payment

Representa un pago Stripe.

---

Campos

id

appointmentId

stripePaymentIntentId

amount

currency

status

paidAt

createdAt

updatedAt

---

Restricciones

Una Consultation puede tener un único Payment.

---

# 10. Entidad Refund

Representa un reembolso Stripe.

---

Campos

id

paymentId

stripeRefundId

amount

refundedAt

createdAt

updatedAt

---

Restricciones

Un Payment puede tener cero o un Refund.

---

# 11. Entidad TattooPlan

Agrupa las características del tatuaje acordado tras una consulta.

Vinculado a exactamente 1 Appointment de tipo CONSULTATION.

---

Campos

id

consultationAppointmentId

style

size

placement

description

notes

status

createdAt

updatedAt

---

Restricciones

consultationAppointmentId único (1 plan por consulta)

---

Relaciones

1 TattooPlan

N TattooPlanSession

---

1 TattooPlan

1 Appointment (CONSULTATION)

---

# 12. Entidad TattooPlanSession

Representa cada sesión individual dentro de un TattooPlan.

---

Campos

id

planId

sessionNumber

durationMinutes

sessionLinkId

status

createdAt

updatedAt

---

Restricciones

(planId, sessionNumber) único — no puede haber dos sesiones con el mismo número en el mismo plan

sessionLinkId único — un SessionLink pertenece como máximo a 1 TattooPlanSession

---

Relaciones

N TattooPlanSession

1 TattooPlan (onDelete: Cascade)

---

1 TattooPlanSession

0..1 SessionLink

---

Reglas

sessionLinkId es null hasta que el admin genera el enlace para esa sesión.

Al eliminar un TattooPlan, sus TattooPlanSession se eliminan en cascada.

---
