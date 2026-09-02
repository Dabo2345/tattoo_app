# AUTH-001 — Autenticación, Autorización y Seguridad

## Estado

Aprobado

## Versión

1.0

---

# 1. Objetivo

Definir:

* Autenticación
* Autorización
* Gestión de sesiones
* Protección de datos
* Seguridad de APIs
* Seguridad de pagos
* Seguridad de enlaces temporales

---

# 2. Principios de Seguridad

## SEC-001

Denegar por defecto.

Todo acceso privado deberá validarse explícitamente.

---

## SEC-002

Mínimo privilegio.

Solo se concederán los permisos estrictamente necesarios.

---

## SEC-003

Nunca confiar en el frontend.

Toda validación crítica se realizará en backend.

---

## SEC-004

Todos los eventos sensibles deberán registrarse en AuditLog.

---

# 3. Sistema de Autenticación

Proveedor:

Better Auth

---

# 4. Usuarios del Sistema

## Client

No tiene cuenta.

No inicia sesión.

Se identifica mediante:

* Email
* Magic Links
* Session Links

---

## Artist

Único usuario autenticado.

Accede al Admin Panel.

---

# 5. Roles

## ADMIN

Único rol existente en MVP.

Permisos:

* Gestión agenda
* Gestión contenido
* Gestión galería
* Gestión citas
* Configuración sistema

---

# 6. Gestión de Sesiones

Duración máxima:

8 horas

---

Inactividad máxima:

8 horas

---

Al superar el límite:

Logout automático

---

# 7. Cookies

Todas las cookies deberán utilizar:

HttpOnly

Secure

SameSite=Lax

---

Producción:

HTTPS obligatorio

---

# 8. Protección de Rutas

## Públicas

/

/galeria

/perfil

/estudio

/reservar

/session-link/*

/magic-link/*

---

## Privadas

/admin/*

---

Middleware obligatorio

Validación Better Auth

---

# 9. Protección de APIs

Todas las APIs administrativas deberán:

Validar sesión

Validar rol

Registrar auditoría

---

# 10. Protección Login

Máximo:

5 intentos fallidos

Ventana:

15 minutos

---

Bloqueo:

15 minutos

---

Eventos registrados:

LOGIN_SUCCESS

LOGIN_FAILED

ACCOUNT_LOCKED

---

# 11. Magic Links

Uso:

Gestión de citas.

---

Duración:

2 horas.

---

Formato:

Token criptográficamente seguro.

---

Restricciones:

Multiuso mientras permanezca válido.

---

Validez:

currentDate < expiresAt

---

Una vez expirado:

El cliente deberá solicitar un nuevo MagicLink.

---

Generación:

crypto.randomBytes()

Longitud mínima:

32 bytes.

---

Almacenamiento:

Se almacenará únicamente el hash del token.

Nunca el token en texto plano.

---

Acceso permitido:

Visualizar cita.

Cancelar cita.

Reprogramar cita.

---

No requiere autenticación mediante cuenta.


# 12. Session Links

Uso:

Reserva TattooSession

---

Duración:

30 días

---

Restricciones:

Un solo uso

---

Asociados a:

Consultation completada

---

# 13. Generación de Tokens

Método:

crypto.randomBytes()

---

Longitud mínima:

32 bytes

---

Almacenamiento:

Hash del token

Nunca token plano

---

# 14. Seguridad Stripe

## Cliente

Nunca accede a claves secretas.

---

## Backend

Gestiona:

Checkout

Webhooks

Refunds

---

# 15. Webhooks Stripe

Validación obligatoria:

Stripe Signature

---

Eventos aceptados:

checkout.session.completed

payment_intent.succeeded

charge.refunded

---

Eventos desconocidos:

Ignorados

Registrados

---

## Rate Limiting del Webhook

El endpoint `POST /api/webhooks/stripe` aplica rate limiting in-memory por IP:

- **Límite:** 60 peticiones por minuto por IP
- **Ventana:** sliding window de 60 segundos
- **IP:** extraída de `x-forwarded-for` (primera entrada) o `x-real-ip`, con fallback a `"unknown"`
- **Respuesta al superar el límite:** HTTP 429 `{ "error": "Too many requests" }`
- **Log:** `logger.warn` con la IP bloqueada

Implementación: `src/lib/api/InMemoryRateLimiter` (in-memory, lazy eviction de entradas expiradas).

El rate limiting es una capa de defensa adicional contra flooding. La verificación de firma Stripe (`constructEvent`) sigue siendo la protección principal contra inyección de eventos falsos.

---

# 16. Protección de Datos Personales

Datos almacenados:

Nombre

Email

Teléfono

Descripción tatuaje

Historial citas

---

Datos nunca almacenados:

Tarjetas bancarias

Métodos de pago completos

Credenciales Stripe

---

# 17. RGPD

Base legal:

Prestación de servicio solicitado.

---

Derechos soportados:

Acceso

Rectificación

Supresión

---

Eliminación definitiva:

Máximo 30 días

---

# 18. Logs

No registrar:

Contraseñas

Tokens

Cookies

Datos Stripe sensibles

---

Permitido:

IDs

Estados

Eventos

Timestamps

---

# 19. Auditoría

Acciones auditables:

Login

Logout

Creación cita

Cancelación cita

Reprogramación

Creación SessionLink

Reembolso

Actualización contenido

Actualización galería

Configuración sistema

---

# 20. Dependencias de Seguridad

Better Auth

Zod

Stripe SDK

Pino

---

# 21. Cabeceras HTTP

Obligatorias:

X-Frame-Options

DENY

---

X-Content-Type-Options

nosniff

---

Referrer-Policy

strict-origin-when-cross-origin

---

Content-Security-Policy

Definida para producción

---

# 22. Backups

Proveedor:

Supabase

---

Frecuencia:

Diaria

---

Retención:

30 días

---

# 23. Recuperación

RPO máximo:

24 horas

---

RTO máximo:

4 horas
