# ISSUE #168 — Fix: validar breaks JSONB con Zod al leer de BD en admin settings

---

# 1. CONTEXTO

El campo `breaks` de `StudioConfig` se almacena como JSONB en PostgreSQL (Prisma lo expone como `JsonValue`).
En `src/app/admin/settings/page.tsx:47` se convierte a `BreakTime[]` sin validación:

```ts
const breaksInitial = config ? (config.breaks as unknown as BreakTime[]) : defaults.breaks
```

El schema Zod `breakTimeItemSchema` ya existe en `actions.ts` (se usa para validar escrituras),
pero no se aprovecha al leer. Si el JSONB en BD tiene forma incorrecta, el componente
`BreakTimesForm` recibe datos sin garantía de estructura.

Root cause: el schema de validación está encapsulado en `actions.ts` sin exportar,
por lo que no puede reutilizarse en la capa de lectura.

---

# 2. OBJETIVO

Reemplazar el cast no tipado `as unknown as BreakTime[]` por un `safeParse` con Zod,
usando el mismo schema que valida las escrituras, con fallback explícito a `[]` si el parseo falla.

---

# 3. ALCANCE (SCOPE)

- Exportar `breaksArraySchema` desde `src/app/admin/settings/actions.ts`
- Usar `breaksArraySchema.safeParse()` en `src/app/admin/settings/page.tsx` para leer `breaks` desde BD
- Loguear con `logger.warn` si el parseo falla (dato corrupto en BD)

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No modificar la lógica de escritura de breaks
- No cambiar el schema de BD ni las migraciones
- No crear archivos nuevos
- No tocar otros formularios del settings (WorkingHoursForm, DepositForm)

---

# 5. ARCHIVOS AFECTADOS

**Código:**
- `src/app/admin/settings/actions.ts` — exportar `breaksArraySchema`
- `src/app/admin/settings/page.tsx` — usar `safeParse` con fallback

**Docs:**
- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md` — mencionar patrón de validación Zod en lectura de JSONB

---

# 6. FLUJO DE EJECUCIÓN

1. En `actions.ts`: extraer y exportar `breaksArraySchema = z.array(breakTimeItemSchema)`
2. Actualizar `breakTimesSchema` para reusarlo: `breaks: breaksArraySchema.max(10)`
3. En `page.tsx`: importar `breaksArraySchema` y reemplazar el cast por `safeParse` con fallback y log
4. Verificar typecheck y lint
5. Añadir tests

---

# 7. REGLAS DE NEGOCIO

- Si `breaks` en BD no es parseable como `BreakTime[]` → usar `[]` (vacío) como fallback
- El fallback nunca debe romper la carga de la página de admin
- Loguear `logger.warn` cuando el parseo falle, para detectar corrupción de datos

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] No existe ningún `as unknown as BreakTime[]` en el codebase
- [ ] `breaksArraySchema` está exportado de `actions.ts`
- [ ] `page.tsx` usa `safeParse` con fallback a `[]`
- [ ] TypeScript sin errores (`tsc --noEmit`)
- [ ] CI verde

---

# 9. CASOS EDGE

- **`config.breaks` es `null`**: Prisma puede devolver `null` para JSONB → `safeParse(null)` debe devolver fallback `[]`
- **`config.breaks` es un objeto en lugar de array**: `safeParse` falla → fallback `[]`
- **`config.breaks` es un array con items inválidos**: `safeParse` falla → fallback `[]`, log de warning
- **`config` es `null` (sin registro en BD)**: ya manejado por el ternario, no cambia

---

# 10. TESTS REQUERIDOS

- Test unitario: `breaksArraySchema` parsea correctamente un array válido
- Test unitario: `breaksArraySchema` falla con datos inválidos (null, objeto, array con items incorrectos)

Ubicación: `tests/unit/admin/settings-schemas.test.ts` (nuevo, pequeño)

---

# 11. DEPENDENCIAS

- Ninguna. Issues anteriores cerradas.

---

# 12. DOCUMENTACIÓN AFECTADA

- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md` — añadir nota sobre patrón de validación Zod al leer JSONB de BD

---

# 13. DEFINITION OF DONE

- [ ] Cast eliminado de `page.tsx`
- [ ] `breaksArraySchema` exportado y reutilizado en `breakTimesSchema`
- [ ] Tests añadidos y pasando
- [ ] `BACK-001` actualizado
- [ ] CI verde
- [ ] PR creado apuntando a `develop`
