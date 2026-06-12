# ISSUE DOC #056 — Bugfix: daysUntil inconsistente — falta Math.floor en 2 lugares

## CONTEXTO

Hay tres implementaciones de cálculo de días hasta la cita en el proyecto, con comportamientos distintos:

| Lugar | Implementación | Math.floor |
|-------|---------------|------------|
| `deposit-policy.ts:21` — `daysUntilAppointment()` | `Math.floor(diffMs / MS_PER_DAY)` | ✅ |
| `admin/cancel/route.ts:9` — función local `daysUntil()` | sin Math.floor | ❌ |
| `notification-service.ts:159` — cálculo inline | sin Math.floor | ❌ |

**Root cause**: La función local en admin/cancel y el cálculo en notification-service se escribieron de forma independiente sin reutilizar `daysUntilAppointment()` ya existente en deposit-policy.

**Impacto concreto**: Con exactamente 3.9 días de antelación:
- `daysUntilAppointment()` devuelve `3` (floor) → refund_policy retiene el depósito ✅
- `daysUntil()` en admin cancel devuelve `3.9` → `3.9 >= 4` es false → correcto por casualidad
- Cálculo en notification-service devuelve `3.9` → `3.9 >= 4` es false → email dice "no reembolso" ✅

Pero con 4.1 días:
- `daysUntilAppointment()` devuelve `4` → reembolsa ✅
- Cálculo en notification-service devuelve `4.1` → `4.1 >= 4` → email dice "reembolso" ✅

El problema real es que hay **código duplicado con lógica frágil**. Si en el futuro alguien cambia el threshold, hay que cambiarlo en 3 sitios.

## OBJETIVO

1. Eliminar la función local `daysUntil()` en `admin/cancel/route.ts` y usar `daysUntilAppointment()` importada
2. Corregir el cálculo inline en `notification-service.ts` para usar `Math.floor()` (o importar `daysUntilAppointment()`)
3. Un único punto de verdad para el cálculo de días

## SCOPE

- `src/app/api/admin/appointments/[id]/cancel/route.ts`
- `src/modules/notification/services/notification-service.ts`

## ANTI-SCOPE

- No modificar `daysUntilAppointment()` en deposit-policy (es la fuente de verdad)
- No cambiar el threshold de 4 días

## ARCHIVOS AFECTADOS

```
src/app/api/admin/appointments/[id]/cancel/route.ts          ← MODIFIED
src/modules/notification/services/notification-service.ts    ← MODIFIED
issues-docs/056-bugfix-daysuntil-math-floor.md               ← NEW
```

## FLUJO DE EJECUCIÓN

### En admin/cancel/route.ts
1. Eliminar la función local `daysUntil()` (líneas 7-10)
2. Importar `daysUntilAppointment` de `@/modules/payment/services/deposit-policy`
3. Reemplazar `daysUntil(appointment.startsAt) >= 4` por `daysUntilAppointment(appointment.startsAt) >= 4`
   - **Nota**: Este campo solo se usa para la respuesta/audit en admin cancel. Con el fix de #053, la lógica real de reembolso ya estará en depositPolicyService.

### En notification-service.ts
1. Localizar la línea: `const daysUntil = (appointment.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)`
2. Opciones (elegir la más limpia):
   - **Opción A**: Importar `daysUntilAppointment` de deposit-policy y usarla: `const daysUntil = daysUntilAppointment(appointment.startsAt)`
   - **Opción B**: Añadir `Math.floor()`: `const daysUntil = Math.floor((appointment.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))`
   - Preferir **Opción A** (DRY)

## CRITERIOS DE ACEPTACIÓN

- [ ] No existe la función local `daysUntil()` en admin/cancel/route.ts
- [ ] notification-service.ts usa `Math.floor()` en el cálculo de días
- [ ] El comportamiento de refund eligibility en notificaciones es consistente con deposit-policy
- [ ] Tests existentes siguen pasando

## TESTS REQUERIDOS

No requiere tests nuevos — los tests existentes de `notification-service.test.ts` y `deposit-policy.test.ts` deben seguir pasando. Verificar especialmente los casos límite de 3 y 4 días.

## DOCUMENTACIÓN AFECTADA

- `docs/Documento 04 — DATA-002 ...` → Confirmar que la regla RB-013 ("≥4 días completos") queda documentada como días enteros (Math.floor)

## DEPENDENCIAS

- #053 recomendado primero (el admin cancel tendrá menos código local después del fix)

## DEFINITION OF DONE

- [ ] Función local `daysUntil()` eliminada de admin cancel
- [ ] Cálculo en notification-service usa Math.floor o daysUntilAppointment()
- [ ] `pnpm test --run` verde
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
