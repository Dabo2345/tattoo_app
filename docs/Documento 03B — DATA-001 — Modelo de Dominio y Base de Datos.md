# DATA-001 — Modelo de Dominio y Base de Datos (Parte 2)

## 11. Entidad BlockedPeriod

Representa periodos donde el artista no acepta reservas.

---

Campos

id

startDateTime

endDateTime

reason

createdAt

updatedAt

---

Ejemplos

Vacaciones

Festivo

Baja médica

Evento personal

---

Restricciones

startDateTime < endDateTime

---

Relaciones

Ninguna

---

# 12. Entidad GalleryImage

Representa una imagen de la galería pública.

---

Campos

id

title

description

storagePath

thumbnailPath

displayOrder

createdAt

updatedAt

deletedAt

---

Restricciones

storagePath único

thumbnailPath único

---

Relaciones

N GalleryImage

N StyleTag

---

# 13. Entidad StyleTag

Representa estilos de tatuaje.

---

Campos

id

name

slug

createdAt

updatedAt

---

Ejemplos

blackwork

realismo

acuarela

fineline

tradicional

japones

---

Restricciones

slug único

name único

---

Relaciones

N StyleTag

N GalleryImage

---

# 14. Entidad Notification

Representa una notificación enviada.

---

Campos

id

appointmentId

type

recipientEmail

subject

status

sentAt

errorMessage

createdAt

updatedAt

---

Relaciones

N Notification

1 Appointment

---

# 15. Entidad AdminUser

Representa al propietario del estudio.

---

Campos

id

email

passwordHash

lastLoginAt

createdAt

updatedAt

---

Restricciones

email único

---

Reglas

Solo existirá un AdminUser.

---

# 16. Entidad AuditLog

Registro de acciones importantes.

---

Campos

id

action

entityType

entityId

performedBy

metadata

createdAt

---

Ejemplos

CONSULTATION_CREATED

CONSULTATION_CANCELLED

SESSION_LINK_CREATED

REFUND_CREATED

PROFILE_UPDATED

GALLERY_IMAGE_DELETED

LOGIN_SUCCESS

LOGIN_FAILED

---

# 17. Relaciones Globales

Client

1 → N Appointment

---

Appointment

1 → 0..1 Payment

---

Payment

1 → 0..1 Refund

---

Appointment

1 → N MagicLink

---

Appointment

1 → 0..1 SessionLink

---

Appointment

1 → N Notification

---

GalleryImage

N ↔ N StyleTag

---

# 18. Índices Obligatorios

Client

email UNIQUE

phone UNIQUE

---

Appointment

status

type

startsAt

clientId

---

SessionLink

token UNIQUE

expiresAt

---

MagicLink

token UNIQUE

expiresAt

---

GalleryImage

displayOrder

---

StyleTag

slug UNIQUE

---

# 19. Soft Delete

Aplicable a:

Client

Appointment

GalleryImage

---

Campo

deletedAt

---

# 20. Convenciones Prisma

Todos los modelos:

PascalCase

---

Campos:

camelCase

---

Tablas:

snake_case

---

Enums:

UPPER_CASE

---

# 21. Convenciones UUID

Todas las entidades usarán:

UUID v7

---

Motivos

Mejor ordenación temporal.

Mejor rendimiento índices.

Escalabilidad futura.

---

# 22. Reglas de Integridad

RI-001

No puede existir un Appointment sin Client.

---

RI-002

No puede existir un Refund sin Payment.

---

RI-003

No puede existir un SessionLink sin Appointment.

---

RI-004

No puede existir un MagicLink sin Appointment.

---

RI-005

No puede existir una Notification sin Appointment.

---

RI-006

No pueden existir dos Appointments solapados.

---

RI-007

No pueden existir SessionLinks activos duplicados para una misma Consultation.

---

RI-008

Una TattooSession siempre debe originarse desde una Consultation previa.

---
