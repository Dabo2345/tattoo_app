# ISSUE DOC #077 — Bugfix: URL del email de SessionLink apunta a /book/:token en vez de /session-link/:token

**Issue GitHub:** #077
**Tipo:** bug
**Prioridad:** P1: High
**Rama:** `fix/077-notification-session-link-url`
**Estado:** EN PROGRESO
**Fecha:** 2026-06-30

---

## 1. CONTEXTO

El fix #075 corrigió la URL en `src/app/api/admin/session-links/route.ts` pero no tocó `src/modules/notification/services/notification-service.ts`. En la línea 304 de ese archivo, `sendSessionLink` construye la URL del email con `/book/${sessionLinkToken}` en lugar de `/session-link/${sessionLinkToken}`. Como la ruta `/book/[token]` no existe en Next.js, el cliente recibe un 404 al hacer click en el botón "Reservar mi sesión" del email.

---

## 2. OBJETIVO

Corregir la URL construida en `notificationService.sendSessionLink` para que apunte a la ruta pública correcta `/session-link/:token`.

---

## 3. SCOPE

- Cambiar la construcción de `sessionLinkUrl` en `src/modules/notification/services/notification-service.ts` línea 304
- De `/book/${sessionLinkToken}` → `/session-link/${sessionLinkToken}`

---

## 4. ANTI-SCOPE

- NO crear la ruta `/book/[token]`
- NO modificar el template de email `session-link.tsx`
- NO modificar ninguna otra parte del notification service

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/modules/notification/services/notification-service.ts` — línea 304

### Docs
- `docs/Documento 16 — NOTIF-001 — Sistema de Notificaciones.md` — sección URL del SessionLink

---

## 6. ROOT CAUSE

El fix #075 fue incompleto: corrigió la URL en el admin route pero no en el notification service, que es donde se construye la URL real que va en el email al cliente.

---

## 7. FIX APLICADO

Cambiar línea 304 de `notification-service.ts`:
```typescript
// Antes (incorrecto)
const sessionLinkUrl = `${env.NEXT_PUBLIC_APP_URL}/book/${sessionLinkToken}`

// Después (correcto)
const sessionLinkUrl = `${env.NEXT_PUBLIC_APP_URL}/session-link/${sessionLinkToken}`
```

---

## 8. REGLAS DE NEGOCIO

- **RB-SL-URL-001:** Las URLs de SessionLink deben apuntar a `/session-link/:token`.

---

## 9. CRITERIOS DE ACEPTACIÓN

- [ ] El email enviado al cliente contiene una URL con `/session-link/` y no `/book/`
- [ ] Al hacer click en "Reservar mi sesión" del email, el cliente llega a la página correcta (no 404)
- [ ] CI verde

---

## 10. EDGE CASES

- **Links ya enviados con URL incorrecta:** Los emails ya enviados tienen la URL antigua. Este fix solo aplica a nuevos SessionLinks generados tras el deploy.

---

## 11. TESTS REQUERIDOS

- Test existente o nuevo en `tests/integration/notifications/` que verifique que `sendSessionLink` construye la URL con `/session-link/` en lugar de `/book/`

---

## 12. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `NOTIF-001` | URL SessionLink en email | Corregir URL de ejemplo a `/session-link/:token` |

---

## 13. DEPENDENCIAS

- #075 (ya completada)

---

## 14. DEFINITION OF DONE

- [ ] `sessionLinkUrl` usa `/session-link/${sessionLinkToken}`
- [ ] Tests pasan
- [ ] CI verde
- [ ] NOTIF-001 actualizado
- [ ] PR creado
