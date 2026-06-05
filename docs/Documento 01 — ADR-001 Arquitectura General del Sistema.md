# ADR-001 — Arquitectura General del Sistema

## Estado

Aprobado

## Versión

1.1

## Fecha

2026-06-02

---

# 1. Objetivo del proyecto

Desarrollar una plataforma web profesional para un estudio de tatuajes que permita:

* Mostrar portfolio y contenido público.
* Gestionar reservas de consultas previas.
* Gestionar sesiones de tatuaje mediante enlaces privados.
* Automatizar pagos de depósitos.
* Automatizar notificaciones por email.
* Gestionar agenda y contenido desde un panel administrativo.

---

# 2. Principios arquitectónicos

## P1. Simplicidad antes que complejidad

No se utilizarán microservicios.

---

## P2. Modularidad

Cada dominio estará separado en módulos independientes.

---

## P3. Type Safety

Todo el proyecto utilizará TypeScript estricto.

---

## P4. Testabilidad

Toda funcionalidad deberá ser testeable de forma aislada.

---

## P5. Documentación obligatoria

Toda nueva funcionalidad deberá estar asociada a:

* Issue
* Pull Request
* Tests
* Documentación

---

## P6. Coste Operativo Mínimo

Durante la fase MVP se priorizarán soluciones gratuitas o con planes gratuitos suficientes.

No se incorporarán servicios de pago recurrentes sin ADR aprobado.

---

# 3. Arquitectura seleccionada

Patrón:

Modular Monolith

---

## Justificación

* Un único administrador.
* Menos de 100 usuarios concurrentes.
* Sin necesidad de escalado independiente.
* Menor complejidad operativa.

---

# 4. Arquitectura lógica

Frontend

* Landing
* Perfil artista
* Galería
* Información estudio
* Sistema reservas
* Gestión mediante Magic Links

Backend

* Auth Module
* Booking Module
* Calendar Module
* Payment Module
* Notification Module
* Gallery Module
* Content Module
* Admin Module
* Audit Module

Infraestructura

* PostgreSQL (Supabase)
* Supabase Storage
* Stripe
* Resend
* Sentry
* Vercel

---

# 5. Módulos del dominio

## Auth Module

Responsabilidades:

* Login administrador
* Gestión sesiones
* Protección rutas privadas

Tecnología:

Better Auth

---

## Booking Module

Responsabilidades:

* Consultations
* TattooSessions
* SessionLinks
* MagicLinks
* Cancelaciones
* Reprogramaciones

---

## Calendar Module

Responsabilidades:

* Slots
* Disponibilidad
* Descansos
* Bloqueos

---

## Payment Module

Responsabilidades:

* Stripe Checkout
* Reembolsos
* Historial pagos

---

## Notification Module

Responsabilidades:

* Confirmaciones
* Cancelaciones
* Recordatorios
* Session Links
* Magic Links

Canal soportado:

Email

---

## Gallery Module

Responsabilidades:

* Imágenes
* Etiquetas
* Ordenación
* Miniaturas

---

## Content Module

Responsabilidades:

* Home
* Perfil artista
* Información estudio

---

## Admin Module

Responsabilidades:

* Agenda
* Contenido
* Galería
* Configuración

---

## Audit Module

Responsabilidades:

* Logs
* Historial cambios
* Trazabilidad

---

# 6. Reglas arquitectónicas

## RA-001

Los módulos no accederán directamente a datos internos de otros módulos.

---

## RA-002

La comunicación entre módulos se realizará mediante servicios internos.

---

## RA-003

No se permitirá lógica de negocio dentro de componentes UI.

---

## RA-004

Stripe únicamente podrá ser accedido desde Backend.

---

## RA-005

Resend únicamente podrá ser accedido desde Backend.

---

# 7. Organización del repositorio

/apps/web

/src

/modules

/auth
/booking
/calendar
/payment
/notification
/gallery
/content
/admin
/audit

/components

/lib

/tests

/docs

---

# 8. Entornos

* Local
* Development
* Staging
* Production

---

# 9. Observabilidad

Eventos mínimos:

* Consultation Created
* Consultation Cancelled
* Consultation Refunded
* Tattoo Session Created
* SessionLink Generated
* MagicLink Generated
* Login Success
* Login Failed

---

# 10. Restricciones

* No microservicios
* No Redux
* No JavaScript sin tipado
* No cambios sin Issue
* No merges directos a main
* No funcionalidades sin tests
