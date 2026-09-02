# ISSUE #170 — Refactor: añadir service layer al módulo gallery

---

# 1. CONTEXTO

El módulo `gallery` viola el patrón de módulos de BACK-001.
No tiene capa de servicios; la lógica de negocio está dispersa en:

- `src/app/admin/gallery/actions.ts` — contiene validación de archivo, cálculo de orden, subida a Supabase, creación en BD y audit log. Todo mezclado con el manejo de Server Actions.
- `src/app/admin/gallery/page.tsx` — accede directamente a `prisma` en lugar de usar el repositorio.

El repositorio actual solo tiene `findAll` y `findAllTags` (lectura pública).
Las escrituras van directamente a Prisma desde las actions.

---

# 2. OBJETIVO

Aplicar el patrón módulo de BACK-001 al módulo gallery:

- Crear `gallery-service.ts` con la lógica de negocio (upload, delete, reorder)
- Añadir al repositorio los métodos de escritura y lectura admin necesarios
- `actions.ts` queda como capa fina: auth → parse → service → revalidate
- `page.tsx` usa el repositorio en lugar de Prisma directamente

---

# 3. ALCANCE (SCOPE)

- `src/modules/gallery/types/index.ts` — añadir `AdminGalleryImageData`, `AdminStyleTagData`, `CreateGalleryImageInput`
- `src/modules/gallery/repositories/gallery-repository.ts` — añadir métodos de escritura y lectura admin
- `src/modules/gallery/services/gallery-service.ts` (nuevo) — lógica de negocio
- `src/app/admin/gallery/actions.ts` — delegación al service
- `src/app/admin/gallery/page.tsx` — usar repositorio
- `tests/unit/modules/gallery/gallery-service.test.ts` (nuevo) — tests del service
- `tests/unit/admin/gallery-actions.test.ts` — actualizar para mockear service en vez de Prisma

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No modificar `api/gallery/route.ts` (ya usa repositorio correctamente)
- No cambiar la UI ni los componentes (GalleryGrid, GalleryUploadForm)
- No cambiar el schema de BD ni las migraciones
- No añadir validación de schemas Zod (ya existe en las actions)
- No tocar el módulo de Supabase storage

---

# 5. ARCHIVOS AFECTADOS

**Código:**
- `src/modules/gallery/types/index.ts`
- `src/modules/gallery/repositories/gallery-repository.ts`
- `src/modules/gallery/services/gallery-service.ts` (nuevo)
- `src/app/admin/gallery/actions.ts`
- `src/app/admin/gallery/page.tsx`

**Tests:**
- `tests/unit/modules/gallery/gallery-service.test.ts` (nuevo)
- `tests/unit/admin/gallery-actions.test.ts` (actualizar mocks)

**Docs:**
- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md` — actualizar sección del módulo gallery

---

# 6. FLUJO DE EJECUCIÓN

1. Añadir tipos `AdminGalleryImageData`, `AdminStyleTagData`, `CreateGalleryImageInput` en `types/index.ts`
2. Añadir métodos al repositorio: `findById`, `getMaxOrder`, `create`, `softDelete`, `updateOrders`, `findAllForAdmin`, `findAllTagsForAdmin`
3. Crear `gallery-service.ts` con `upload`, `softDelete`, `reorder`
4. Actualizar `actions.ts` para delegar al service
5. Actualizar `page.tsx` para usar el repositorio
6. Crear `gallery-service.test.ts`
7. Actualizar `gallery-actions.test.ts`
8. Verificar typecheck y CI

---

# 7. REGLAS DE NEGOCIO

- El service usa `auditService.log()` (no `prisma.auditLog.create` directo)
- El orden de nueva imagen = `maxOrder + 1`; si no hay imágenes, orden = 0
- El soft delete requiere que la imagen exista y no esté ya eliminada
- El reorder con array vacío es no-op (success sin DB call)
- Validation de archivo (tipo/tamaño) ocurre en el service, antes de subir a Supabase

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] `gallery-service.ts` existe con `upload`, `softDelete`, `reorder`
- [ ] El repositorio tiene los métodos de escritura y lectura admin
- [ ] `actions.ts` no contiene lógica de negocio (solo auth, parse, delegate, revalidate)
- [ ] `page.tsx` no importa `prisma` directamente
- [ ] Tests del service pasando
- [ ] Tests de actions actualizados y pasando
- [ ] TypeScript sin errores
- [ ] CI verde

---

# 9. CASOS EDGE

- **`getMaxOrder` sin imágenes en BD**: `_max.order` es `null` → orden = 0
- **`reorder` con array vacío**: no-op, devuelve sin llamar a BD
- **`softDelete` de imagen ya eliminada**: `findById` devuelve `null` → error "Imagen no encontrada"
- **Fallo en Supabase upload**: el error burbujea al action, que devuelve `{ success: false, error }`

---

# 10. TESTS REQUERIDOS

**`gallery-service.test.ts`** (nuevo):
- `upload`: éxito, error por archivo inválido, cálculo correcto de orden
- `softDelete`: éxito, error si imagen no encontrada
- `reorder`: éxito con IDs, no-op con array vacío

**`gallery-actions.test.ts`** (actualizar):
- Mockear `galleryService` en lugar de `prisma` + `storage` directamente
- Mantener mismos escenarios de test (auth, formData parsing, revalidatePath)

---

# 11. DEPENDENCIAS

- Ninguna. Issues anteriores cerradas.

---

# 12. DOCUMENTACIÓN AFECTADA

- `docs/Documento 15 — BACK-001 — Arquitectura Backend.md` — actualizar estructura del módulo gallery para reflejar que ahora tiene service layer

---

# 13. DEFINITION OF DONE

- [ ] `gallery-service.ts` creado
- [ ] Repositorio actualizado con métodos de escritura/lectura admin
- [ ] `actions.ts` delega al service
- [ ] `page.tsx` usa repositorio
- [ ] Tests del service creados y pasando
- [ ] Tests de actions actualizados y pasando
- [ ] `BACK-001` actualizado
- [ ] CI verde
- [ ] PR creado apuntando a `develop`
