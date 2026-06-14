# ISSUE DOC #060 — Fix: accesibilidad aria-pressed en role=listitem (4 componentes)

## CONTEXTO

ESLint reporta el warning `jsx-a11y/role-supports-aria-props` en 4 componentes de booking:

```
./src/modules/booking/components/appointment-manager.tsx:347
./src/modules/booking/components/booking-wizard.tsx:194
./src/modules/booking/components/session-booking.tsx:258
./src/modules/booking/components/slot-picker.tsx:70
```

El atributo `aria-pressed` es un atributo de estado para elementos con rol `button`. No está soportado en elementos con `role="listitem"`. Esto genera accesibilidad incorrecta: los lectores de pantalla no interpretarán correctamente el estado de selección.

## OBJETIVO

Corregir el uso de `aria-pressed` en los 4 componentes afectados para que sea accesible.

## ANÁLISIS

`aria-pressed` indica si un botón está "presionado/seleccionado". Las opciones para cada elemento son:

**Opción A** (si el elemento es interactivo/seleccionable): 
- Cambiar el elemento a `<button>` o añadir `role="button"`
- Mantener `aria-pressed={isSelected}`

**Opción B** (si el elemento es un item de lista con estado visual):
- Mantener `role="listitem"` (o sin role en un `<li>`)
- Reemplazar `aria-pressed` por `aria-selected={isSelected}` (soportado en listitem si el padre es un listbox)
- O usar `aria-current={isSelected ? "true" : undefined}`

Debe revisarse cada componente para entender qué elemento es y elegir la opción semánticamente correcta.

## SCOPE

- `src/modules/booking/components/appointment-manager.tsx`
- `src/modules/booking/components/booking-wizard.tsx`
- `src/modules/booking/components/session-booking.tsx`
- `src/modules/booking/components/slot-picker.tsx`

## ANTI-SCOPE

- No cambiar la lógica de negocio
- No cambiar el diseño visual (solo los atributos de accesibilidad)

## ARCHIVOS AFECTADOS

```
src/modules/booking/components/appointment-manager.tsx   ← MODIFIED
src/modules/booking/components/booking-wizard.tsx        ← MODIFIED
src/modules/booking/components/session-booking.tsx       ← MODIFIED
src/modules/booking/components/slot-picker.tsx           ← MODIFIED
issues-docs/060-fix-accessibility-aria-pressed.md        ← NEW
```

## CRITERIOS DE ACEPTACIÓN

- [ ] `pnpm lint` sin warnings de `jsx-a11y/role-supports-aria-props`
- [ ] Los elementos mantienen el comportamiento visual de selección
- [ ] La semántica HTML es correcta (role + aria attribute son compatibles)

## TESTS REQUERIDOS

No requiere tests nuevos. Verificar con `pnpm lint` que los warnings desaparecen.

## DOCUMENTACIÓN AFECTADA

- Ninguna

## DEPENDENCIAS

- Ninguna

## DEFINITION OF DONE

- [ ] 0 warnings de `jsx-a11y/role-supports-aria-props` en pnpm lint
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
