# Skill: auth

## Propósito

Guía de referencia rápida para la autenticación y autorización del sistema.

---

## Stack

- **Proveedor**: Better Auth
- **Alcance**: Solo el administrador. Los clientes NO tienen cuentas.
- **Módulo**: `/src/modules/auth/` + `/src/lib/auth/`

---

## Tipos de acceso al sistema

| Actor | Mecanismo | Descripción |
|-------|-----------|-------------|
| Administrador | Better Auth session | Login email + contraseña, sesión 8 horas |
| Cliente (gestión cita) | MagicLink | Token seguro, válido 2 horas, multi-uso |
| Cliente (reserva sesión) | SessionLink | Token seguro, válido 30 días, un solo uso |

---

## Verificar sesión de admin

En Route Handlers:

```typescript
// Usar middleware withAdminAuth
export const GET = withAdminAuth(async (req, session) => {
  // session.user.id disponible aquí
})
```

En Server Actions:

```typescript
"use server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const session = await auth.api.getSession({ headers: await headers() })
if (!session) throw new Error("UNAUTHORIZED")
```

---

## Validar MagicLink

```typescript
// En /api/magic-links/[token]/route.ts
const link = await magicLinkRepository.findByTokenHash(hashToken(token))

if (!link) throw new LinkExpiredError()
if (link.expiresAt < new Date()) throw new LinkExpiredError()
// No hay concepto de "ya usado" en MagicLinks — solo expiran por tiempo
```

---

## Validar SessionLink

```typescript
// En /api/session-links/[token]/route.ts
const link = await sessionLinkRepository.findByTokenHash(hashToken(token))

if (!link) throw new LinkExpiredError()
if (link.expiresAt < new Date()) throw new LinkExpiredError()
if (link.usedAt !== null) throw new LinkAlreadyUsedError()
```

---

## Generación de tokens

```typescript
import { generateSecureToken, hashToken } from "@/lib/utils/tokens"

const token = generateSecureToken()      // 64 chars hex (se envía al cliente en URL)
const tokenHash = hashToken(token)       // SHA-256 (se guarda en DB)
```

**Nunca guardar el token en texto plano en la DB.**

---

## Configuración de sesión Better Auth

- Duración máxima: 8 horas
- Timeout por inactividad: 8 horas
- Cookies: HttpOnly, Secure, SameSite=Lax
- Máximo 5 intentos de login → bloqueo 15 minutos

---

## Rutas públicas vs privadas

```
PÚBLICAS (sin auth):
  /
  /galeria
  /perfil
  /estudio
  /reservar
  /session-link/*
  /magic-link/*
  /api/availability
  /api/consultations
  /api/session-links/*
  /api/magic-links/*
  /api/gallery
  /api/content/*
  /api/webhooks/stripe

PRIVADAS (requieren Better Auth session):
  /admin/*
  /api/admin/*
```

---

## Reglas de seguridad

- SEC-001: Denegar por defecto (todo acceso privado explícitamente validado)
- SEC-002: Mínimo privilegio
- SEC-003: Nunca confiar en el frontend (toda validación crítica en backend)
- Ver AUTH-001 para la documentación completa de seguridad
