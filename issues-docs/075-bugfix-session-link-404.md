# ISSUE DOC #075 — Bugfix: SessionLink da 404 — URL apunta a /book/:token en vez de /session-link/:token

**Issue GitHub:** #075 (Dabo2345/tattoo_app#145)
**Tipo:** bug
**Prioridad:** P1: High
**Rama:** `fix/075-session-link-url`
**Estado:** PENDIENTE
**Fecha:** 2026-06-18

---

## 1. CONTEXTO

Cuando el admin genera un SessionLink, la URL construida en el backend apunta a `/book/${token}`. Sin embargo, la ruta pública en Next.js existe en `/session-link/[token]/page.tsx`. No existe ninguna ruta `/book/[token]`. Al hacer click en el link (desde el email o desde el panel admin), el usuario recibe un 404.

---

## 2. OBJETIVO

Corregir la URL que construye el admin route al crear un SessionLink para que apunte a la ruta correcta `/session-link/[token]`.

---

## 3. SCOPE

- Cambiar la construcción de `linkUrl` en `src/app/api/admin/session-links/route.ts`
- De `/book/${token}` → `/session-link/${token}`

---

## 4. ANTI-SCOPE

- NO crear una nueva ruta `/book/[token]`
- NO modificar la página `session-link/[token]/page.tsx`
- NO modificar la API de session-links

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/app/api/admin/session-links/route.ts` — línea donde se construye `linkUrl` (actualmente `/book/${token}`)

### Tests
- `tests/integration/admin/session-links.test.ts` (si existe) — verificar que la URL generada sea correcta

### Docs
- `docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md` — sección Session Links

---

## 6. FLUJO DE EJECUCIÓN

1. En `src/app/api/admin/session-links/route.ts`, localizar la línea:
   ```typescript
   const linkUrl = `${env.NEXT_PUBLIC_APP_URL}/book/${token}`
   ```
2. Cambiar por:
   ```typescript
   const linkUrl = `${env.NEXT_PUBLIC_APP_URL}/session-link/${token}`
   ```
3. Verificar que la ruta `/session-link/[token]/page.tsx` existe y está operativa
4. Actualizar API-001

---

## 7. REGLAS DE NEGOCIO

- **RB-SL-URL-001:** Las URLs de SessionLink deben apuntar a la ruta pública `/session-link/[token]` donde el cliente puede ver la información de la sesión y elegir fecha/hora.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] Al hacer click en el link del email, el cliente llega a la página de reserva de sesión (no un 404)
- [ ] La URL generada en la respuesta del API admin contiene `/session-link/` y no `/book/`
- [ ] CI verde

---

## 9. EDGE CASES

- **Links ya generados con URL incorrecta:** Los SessionLinks existentes en DB ya tienen la URL incorrecta en el email enviado. Este fix solo aplica a nuevos SessionLinks generados tras el fix.

---

## 10. TESTS REQUERIDOS

- Test existente o nuevo que verifique que la URL devuelta por `POST /api/admin/session-links` contiene `/session-link/` en lugar de `/book/`

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `API-001` | Session Links | Corregir URL de ejemplo a `/session-link/:token` |

---

## 12. DEPENDENCIAS

Ninguna.

---

## 13. DEFINITION OF DONE

- [ ] `linkUrl` usa `/session-link/${token}`
- [ ] Tests pasan
- [ ] CI verde
- [ ] API-001 actualizado
- [ ] PR creado
