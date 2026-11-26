# ISSUE #172 — Fix: build falla por export no-async en archivo "use server" (admin settings)

---

# 1. CONTEXTO

Al desplegar `develop` en Vercel, `next build` falla en el paso "Collecting page data":

```
[Error: Failed to collect configuration for /admin/settings] {
  [cause]: Error: A "use server" file can only export async functions, found object.
}
```

`src/app/admin/settings/actions.ts` tiene la directiva `"use server"` y exporta `breaksArraySchema`
(un objeto Zod). Next.js solo permite exportar funciones async desde archivos `"use server"`,
porque cada export se convierte en un endpoint invocable desde el cliente.

**Root cause:** en #168 se exportó `breaksArraySchema` desde `actions.ts` para reutilizarlo al leer
el JSONB en `page.tsx`. La restricción de Next.js solo se comprueba en `next build`, no en
`pnpm dev` ni en Vitest, por eso la regresión pasó desapercibida.

---

# 2. OBJETIVO

Mover `breakTimeItemSchema` y `breaksArraySchema` a un archivo de schemas sin `"use server"`
para que `next build` pase. Cero cambios de lógica o de comportamiento visible.

---

# 3. ALCANCE (SCOPE)

- Crear `src/modules/admin/schemas/settings-schemas.ts` con los dos schemas (contenido idéntico)
- `actions.ts`, `page.tsx` y `settings-actions.test.ts` importan desde el nuevo archivo
- Test de regresión que verifica que ningún archivo `"use server"` exporta valores no-función
- Actualizar BACK-001 §11.3

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No modificar el contenido de los schemas ni sus mensajes de error
- No mover `workingHoursSchema`, `breakTimesSchema` ni `depositSchema` (no se exportan, no rompen el build)
- No tocar la lógica de las server actions ni de `page.tsx`
- No cambiar configuración de Vercel, `package.json` ni dependencias

---

# 5. ARCHIVOS AFECTADOS

**Código:**
- `src/modules/admin/schemas/settings-schemas.ts` — nuevo, contiene los schemas movidos
- `src/app/admin/settings/actions.ts` — elimina la definición, importa `breaksArraySchema`
- `src/app/admin/settings/page.tsx` — cambia el import

**Tests:**
- `tests/unit/admin/settings-actions.test.ts` — cambia el import
- `tests/unit/admin/use-server-exports.test.ts` — nuevo, test de regresión

**Docs:**
- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md` — §11.3

---

# 6. FLUJO DE EJECUCIÓN

1. Crear `settings-schemas.ts` con `breakTimeItemSchema` y `breaksArraySchema`
2. Eliminar ambos de `actions.ts` e importar `breaksArraySchema`
3. Actualizar imports en `page.tsx` y en el test existente
4. Añadir test de regresión de exports en archivos `"use server"`
5. Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm test:run` y `pnpm build`
6. Actualizar BACK-001

---

# 7. REGLAS DE NEGOCIO

- Sin cambios. La validación de pausas (máx. 10, inicio < fin, UUID, label 1–100) es idéntica.

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] `pnpm build` termina sin errores
- [ ] `actions.ts` solo exporta funciones async y tipos
- [ ] Los 6 tests existentes de `breaksArraySchema` siguen pasando
- [ ] Test de regresión de `"use server"` pasando
- [ ] TypeScript sin errores
- [ ] CI verde

---

# 9. CASOS EDGE

- **Otros archivos `"use server"`** (`admin/content/actions.ts`, `admin/gallery/actions.ts`): revisados, no exportan valores no-función. El test de regresión los cubre.
- **`export type` / `export interface`** en archivos `"use server"`: permitidos (se borran al compilar); el test no los marca.

---

# 10. TESTS REQUERIDOS

- Unit: `tests/unit/admin/use-server-exports.test.ts` — recorre `src/`, y para cada archivo con `"use server"` verifica que no hay `export const|let|var|class|enum` ni `export default` no-async
- Unit existente: `tests/unit/admin/settings-actions.test.ts` — sigue pasando con el nuevo import

---

# 11. DOCUMENTACIÓN AFECTADA

- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md` — §11.3: los schemas reutilizables viven en `/src/modules/[modulo]/schemas/`; aviso de que nunca se exportan objetos desde archivos `"use server"`

**Fix aplicado:** schemas movidos a `src/modules/admin/schemas/settings-schemas.ts`.
**Doc actualizado:** BACK-001 §11.3 refleja el comportamiento correcto.

---

# 12. DEPENDENCIAS

- Ninguna. Regresión de #168 (cerrada).

---

# 13. DEFINITION OF DONE

- [ ] Schemas movidos sin cambios de contenido
- [ ] `pnpm build` verde en local
- [ ] Tests añadidos y pasando
- [ ] `BACK-001` actualizado
- [ ] CI verde
- [ ] PR creado apuntando a `develop`
