# ISSUE DOC #061 — Clean code: imports no usados y useEffect con dependencia faltante

## CONTEXTO

ESLint reporta varios warnings de código muerto y React hooks:

| Archivo | Línea | Warning |
|---------|-------|---------|
| `booking-wizard.tsx` | 4 | `'z' is defined but never used` |
| `appointment-cancelled.tsx` | 1 | `'Button' is defined but never used` |
| `base-layout.tsx` | 1 | `'Section' is defined but never used` |
| `appointment-manager.tsx` | 140 | `useEffect has a missing dependency: 'appointment.type'` |

Estos son warnings que no bloquean el build pero indican código muerto que puede confundir a futuros desarrolladores o enmascarar bugs.

El warning de `useEffect` en `appointment-manager.tsx` es potencialmente un bug latente: si `appointment.type` cambia sin que el efecto se re-ejecute, puede haber comportamiento stale.

## OBJETIVO

1. Eliminar los 3 imports no usados
2. Corregir el `useEffect` añadiendo la dependencia faltante o justificando explícitamente su omisión con un comentario

## SCOPE

- `src/modules/booking/components/booking-wizard.tsx`
- `src/modules/notification/templates/appointment-cancelled.tsx`
- `src/modules/notification/templates/base-layout.tsx`
- `src/modules/booking/components/appointment-manager.tsx`

## ANTI-SCOPE

- No cambiar la lógica de los componentes más allá de lo necesario
- No refactorizar los componentes

## ARCHIVOS AFECTADOS

```
src/modules/booking/components/booking-wizard.tsx              ← MODIFIED (eliminar import 'z')
src/modules/notification/templates/appointment-cancelled.tsx   ← MODIFIED (eliminar import 'Button')
src/modules/notification/templates/base-layout.tsx             ← MODIFIED (eliminar import 'Section')
src/modules/booking/components/appointment-manager.tsx         ← MODIFIED (corregir useEffect)
issues-docs/061-clean-code-unused-imports-use-effect.md        ← NEW
```

## FLUJO DE EJECUCIÓN

### Imports no usados (3 archivos)
Simplemente eliminar el import del símbolo no usado. Si es el único símbolo del import, eliminar toda la línea.

### useEffect en appointment-manager.tsx
1. Leer el useEffect en la línea 140 para entender qué hace
2. Determinar si `appointment.type` debería estar en las dependencias:
   - **Si sí**: añadirlo al array `[..., appointment.type]`
   - **Si no** (el efecto intencionalmente ignora cambios de type): añadir comentario `// eslint-disable-next-line react-hooks/exhaustive-deps` con explicación de por qué se excluye

## CRITERIOS DE ACEPTACIÓN

- [ ] `pnpm lint` sin warnings de `@typescript-eslint/no-unused-vars` en estos archivos
- [ ] `pnpm lint` sin warnings de `react-hooks/exhaustive-deps` en appointment-manager.tsx
- [ ] El comportamiento de los componentes no cambia

## TESTS REQUERIDOS

No requiere tests nuevos.

## DOCUMENTACIÓN AFECTADA

- Ninguna

## DEPENDENCIAS

- Ninguna

## DEFINITION OF DONE

- [ ] 0 warnings de unused vars en los archivos afectados
- [ ] useEffect corregido o documentado
- [ ] `pnpm lint` limpio
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
