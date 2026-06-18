# DATA-002 — Reglas de Negocio

## Estado

Aprobado

## Versión

1.0

---

# RB-001

Un cliente no necesita crear cuenta.

---

# RB-002

~~Toda Consultation requiere depósito previo.~~ — **DEPRECADA** (#067)

---

# RB-003

~~Ninguna Consultation se confirma sin pago Stripe válido.~~ — **DEPRECADA** (#067)

---

# RB-NEW-001

Las Consultations se confirman directamente al crearse, sin pago previo. El appointment nace en estado `CONFIRMED`.

---

# RB-NEW-002

El email de confirmación de consulta se envía inmediatamente tras crear el appointment, desde la API (`POST /api/consultations`), sin depender del webhook de Stripe.

---

# RB-NEW-003

Al cancelar una consulta sin registro `Payment` asociado, no se ejecuta ninguna lógica de reembolso. La cancelación procede directamente.

---

# RB-004

Las TattooSessions nunca requieren pago online.

---

# RB-005

Una TattooSession solo puede reservarse mediante SessionLink válido.

---

# RB-006

Un SessionLink solo puede utilizarse una vez.

---

# RB-007

Un MagicLink tiene validez máxima de 2 horas.

---

# RB-008

Los Slots visibles se limitan a los próximos 60 días.

---

# RB-009

Horario laboral por defecto:

10:00 a 20:00

---

# RB-010

Las pausas configuradas bloquean automáticamente los slots.

---

# RB-011

Los BlockedPeriods tienen prioridad absoluta sobre cualquier disponibilidad.

---

# RB-012

No se permiten reservas solapadas.

---

# RB-013

La cancelación con 4 días o más de antelación genera reembolso automático vía Stripe.
Los días se calculan como días completos usando `Math.floor` de la diferencia en milisegundos.

---

# RB-014

La cancelación con menos de 4 días completos de antelación retiene el depósito.
Los días se calculan con `Math.floor` (igual que RB-013).

---

# RB-015

Reprogramar con menos de 4 días equivale a cancelar.

---

# RB-016

Toda cita confirmada genera un MagicLink.

---

# RB-017

Toda modificación genera una nueva notificación.

---

# RB-018

Toda cancelación genera una notificación.

---

# RB-019

Las imágenes eliminadas pasan primero a Soft Delete.

---

# RB-020

Toda acción administrativa relevante genera un AuditLog.

---

# RB-021

El sistema de recordatorios utiliza ventanas de tiempo centradas en los 24h y 2h previos a la cita:
- Recordatorio 24h: se envía si `startsAt` está entre `now + 23.5h` y `now + 24.5h`
- Recordatorio 2h: se envía si `startsAt` está entre `now + 1.5h` y `now + 2.5h`

Solo se envían a appointments en estado `CONFIRMED`.

---

# RB-022

El envío de recordatorios es idempotente: antes de enviar un recordatorio, el sistema verifica
si ya existe un registro `Notification` del mismo tipo (`REMINDER_24H` / `REMINDER_2H`) para
ese appointment. Si existe, se ignora sin reenviar.
