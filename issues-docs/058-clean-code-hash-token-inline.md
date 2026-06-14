# ISSUE DOC #058 — Clean code: hashToken inline duplicado en 3 rutas

## CONTEXTO

Tres rutas usan el hashing SHA-256 directamente (inline) en lugar de importar la función `hashToken()` que ya existe en `@/lib/utils/tokens`:

| Archivo | Línea | Código duplicado |
|---------|-------|-----------------|
| `src/app/api/appointments/[id]/cancel/route.ts` | 31 | `createHash("sha256").update(magicLinkToken).digest("hex")` |
| `src/app/api/appointments/[id]/reschedule/route.ts` | 39 | `createHash("sha256").update(magicLinkToken).digest("hex")` |
| `src/app/api/admin/session-links/route.ts` | ~117 | Usa `createHash` y también importa `randomBytes` |

**Root cause**: Estas rutas fueron implementadas antes o en paralelo a la creación de `hashToken()` en `@/lib/utils/tokens`, sin adoptar la función centralizada.

**Riesgo**: Si en el futuro se cambia el algoritmo de hashing, hay que encontrar y actualizar 3+ sitios en lugar de uno. Los servicios (`magicLinkService`, `sessionLinkService`) ya usan `hashToken()` correctamente.

## OBJETIVO

Reemplazar los tres usos inline de `createHash("sha256")` por la función `hashToken()` importada de `@/lib/utils/tokens`.

## SCOPE

- `src/app/api/appointments/[id]/cancel/route.ts`
- `src/app/api/appointments/[id]/reschedule/route.ts`
- `src/app/api/admin/session-links/route.ts`

## ANTI-SCOPE

- No modificar `hashToken()` en tokens.ts
- No cambiar la lógica de negocio

## ARCHIVOS AFECTADOS

```
src/app/api/appointments/[id]/cancel/route.ts       ← MODIFIED
src/app/api/appointments/[id]/reschedule/route.ts   ← MODIFIED
src/app/api/admin/session-links/route.ts            ← MODIFIED
issues-docs/058-clean-code-hash-token-inline.md     ← NEW
```

## FLUJO DE EJECUCIÓN

Para cada archivo:
1. Añadir import: `import { hashToken } from "@/lib/utils/tokens"`
2. Eliminar el import de `createHash` de `"crypto"` (si ya no se usa para nada más)
3. Reemplazar `createHash("sha256").update(token).digest("hex")` por `hashToken(token)`

En `admin/session-links/route.ts`:
- Verificar qué usa `createHash` y qué usa `randomBytes`
- Solo eliminar `createHash` del import si se reemplaza por `hashToken`
- `randomBytes` puede seguir importado si se usa para generar el token

## CRITERIOS DE ACEPTACIÓN

- [ ] Ningún archivo en `src/app/api/` contiene `createHash("sha256")` inline
- [ ] Los tres archivos importan `hashToken` de `@/lib/utils/tokens`
- [ ] Los tests existentes siguen pasando (el comportamiento no cambia)

## TESTS REQUERIDOS

No requiere tests nuevos. Los tests de integración existentes para estas rutas deben seguir pasando sin cambios (el hashing produce el mismo resultado).

## DOCUMENTACIÓN AFECTADA

- Ninguna (cambio interno de implementación, no afecta contratos de API)

## DEPENDENCIAS

- Ninguna

## DEFINITION OF DONE

- [ ] `createHash("sha256")` inline eliminado de las 3 rutas
- [ ] `hashToken()` usado en su lugar
- [ ] `pnpm test --run` verde
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
