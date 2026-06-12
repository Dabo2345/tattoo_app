# ISSUE DOC #048 — Templates React Email: cancelled, rescheduled, magic-link, session-link

## CONTEXTO

Los issues #046 y #047 establecieron la infraestructura Resend y los dos primeros templates (consultation-confirmed, session-confirmed). Quedan 4 templates por crear para completar los flujos de notificación del MVP definidos en NOTIF-001 §2.

Los payloads para los 4 templates ya están definidos en `src/modules/notification/types/index.ts` y el patrón de implementación está establecido en los templates existentes.

---

## OBJETIVO

Crear 4 templates React Email siguiendo el patrón de los templates existentes:

1. `appointment-cancelled.tsx` — cancelación con política de depósito
2. `appointment-rescheduled.tsx` — reprogramación con nueva fecha y MagicLink
3. `magic-link.tsx` — enlace de gestión de cita (válido 2h)
4. `session-link.tsx` — enlace para reservar sesión (válido 30 días)

---

## SCOPE

- 4 archivos de template en `src/modules/notification/templates/`
- 4 archivos de test en `tests/unit/modules/notification/`
- Usar los payloads ya definidos en `src/modules/notification/types/index.ts`
- Seguir exactamente el patrón visual de `consultation-confirmed.tsx`

## ANTI-SCOPE

- No crear ni modificar `notification-service.ts` (issue #049)
- No modificar `src/modules/notification/types/index.ts`
- No modificar `base-layout.tsx`
- No crear helpers de texto plano (React Email genera texto plano automáticamente)

---

## ARCHIVOS AFECTADOS

**Nuevos:**
- `src/modules/notification/templates/appointment-cancelled.tsx`
- `src/modules/notification/templates/appointment-rescheduled.tsx`
- `src/modules/notification/templates/magic-link.tsx`
- `src/modules/notification/templates/session-link.tsx`
- `tests/unit/modules/notification/appointment-cancelled.test.tsx`
- `tests/unit/modules/notification/appointment-rescheduled.test.tsx`
- `tests/unit/modules/notification/magic-link.test.tsx`
- `tests/unit/modules/notification/session-link.test.tsx`

**Sin cambios:**
- `src/modules/notification/types/index.ts` — payloads ya definidos
- `src/modules/notification/templates/base-layout.tsx`

---

## FLUJO DE EJECUCIÓN

1. Crear rama `feature/048-email-templates-cancelled-rescheduled`
2. Implementar `appointment-cancelled.tsx`
3. Implementar `appointment-rescheduled.tsx`
4. Implementar `magic-link.tsx`
5. Implementar `session-link.tsx`
6. Crear tests para cada template
7. Verificar `pnpm typecheck && pnpm test:run`
8. Crear PR

---

## REGLAS DE NEGOCIO

De NOTIF-001 §6.2 y DATA-002:

- **appointment-cancelled**: mostrar claramente si hay reembolso (`refundAmount > 0`) o retención. Si `refundDays > 0`, indicar el plazo. Si `refundAmount === 0`, indicar que el depósito se retiene por política (cancelación tardía).
- **appointment-rescheduled**: mostrar fecha anterior (`oldDate`) y nueva fecha (`newDate` + `newTime`). Incluir nuevo MagicLink para gestionar la cita reprogramada.
- **magic-link**: enlace válido `expiresInHours` horas (siempre 2h). Botón CTA principal "Gestionar mi cita". Indicar la fecha de expiración.
- **session-link**: enlace válido `expiresInHours` horas (siempre 720h = 30 días). Botón CTA "Reservar mi sesión". Incluir `artistNotes` si existe.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `appointment-cancelled.tsx` renderiza correctamente con y sin reembolso
- [ ] `appointment-cancelled.tsx` muestra mensaje diferente si `refundAmount === 0`
- [ ] `appointment-rescheduled.tsx` muestra fecha anterior y nueva fecha
- [ ] `appointment-rescheduled.tsx` incluye el MagicLink en el botón CTA
- [ ] `magic-link.tsx` incluye el link y la expiración en horas
- [ ] `session-link.tsx` incluye el link y la expiración, y muestra `artistNotes` si existe
- [ ] Los 4 templates usan `BaseLayout` con `preview` descriptivo
- [ ] Los 4 templates siguen el sistema de estilos de `consultation-confirmed.tsx`
- [ ] Tests de renderizado para los 4 templates (mínimo 5 asserts por template)
- [ ] `pnpm typecheck` sin errores
- [ ] `pnpm test:run` verde

---

## EDGE CASES

- `refundAmount === 0` en cancelled → mensaje "el depósito no será reembolsado"
- `refundAmount > 0` en cancelled → mostrar importe y plazo de `refundDays` días
- `artistNotes` undefined en session-link → no renderizar la sección de notas
- Expiración en magic-link: siempre 2h; en session-link: siempre mostrado como "30 días"

---

## TESTS REQUERIDOS

Patrón idéntico al de `consultation-confirmed.test.tsx`:

```typescript
import { render } from "@react-email/render"
import { createElement } from "react"

async function renderTemplate(props): Promise<string> {
  return render(createElement(ComponentEmail, props))
}
```

Por template:
- Contiene nombre del cliente
- Contiene fechas/datos principales
- CTA contiene la URL correcta
- Caso edge específico del template (reembolso/no-reembolso, notas opcionales, etc.)

---

## DEPENDENCIAS

- #046 — Setup Resend ✅
- #047 — Templates consultation-confirmed y session-confirmed ✅

---

## DEFINITION OF DONE

- [ ] 4 templates implementados en `src/modules/notification/templates/`
- [ ] 4 archivos de test con mínimo 5 asserts cada uno
- [ ] `pnpm typecheck` sin errores
- [ ] `pnpm test:run` 100% verde
- [ ] PR creado con descripción completa
- [ ] CI verde
