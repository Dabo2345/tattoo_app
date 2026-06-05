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

Toda Consultation requiere depósito previo.

---

# RB-003

Ninguna Consultation se confirma sin pago Stripe válido.

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

La cancelación con 4 días o más genera reembolso automático.

---

# RB-014

La cancelación con menos de 4 días retiene el depósito.

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
