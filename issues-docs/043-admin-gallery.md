# ISSUE DOC — #043 Admin: gestión de galería (upload, reordenar, soft delete)

## 1. CONTEXTO

El panel admin necesita gestionar la galería de imágenes del estudio. Esto incluye subir imágenes nuevas con StyleTags, reordenarlas visualmente (drag-and-drop) y eliminarlas de forma segura (soft delete, RB-019).

## 2. OBJETIVO

Implementar la página `/admin/gallery` con Server Actions para upload, reorder y delete de imágenes de galería, más la UI correspondiente con drag-and-drop.

## 3. SCOPE

- `src/lib/supabase/storage.ts`: cliente Supabase Storage + helpers (uploadImage, deleteImage, getPublicUrl)
- Server Actions en `src/app/admin/gallery/actions.ts`:
  - `uploadGalleryImageAction(formData)`: valida formato/tamaño → sube a Supabase → crea GalleryImage en DB → AuditLog
  - `reorderGalleryAction(orderedIds)`: actualiza campo `order` en DB
  - `deleteGalleryImageAction(id)`: soft delete (deletedAt = now()) → AuditLog
- `/admin/gallery/page.tsx`: Server Component que carga imágenes
- `GalleryGrid` (client): grid con drag-and-drop usando `@dnd-kit/sortable`
- `GalleryUploadForm` (client): formulario de upload con selección de StyleTags
- Tests de las Server Actions

## 4. ANTI-SCOPE

- Thumbnails/redimensionado de imágenes
- Galería pública del cliente (issue separada)
- Gestión de StyleTags (CRUD de tags en sí)

## 5. ARCHIVOS AFECTADOS

- `issues-docs/043-admin-gallery.md` (nuevo)
- `src/lib/supabase/storage.ts` (nuevo)
- `src/app/admin/gallery/actions.ts` (nuevo)
- `src/app/admin/gallery/page.tsx` (nuevo)
- `src/components/admin/gallery-grid.tsx` (nuevo)
- `src/components/admin/gallery-upload-form.tsx` (nuevo)
- `tests/unit/admin/gallery-actions.test.ts` (nuevo)

## 6. FLUJO DE EJECUCIÓN

### Upload
1. Admin selecciona archivo (JPEG/WebP, ≤10MB) y StyleTags
2. `uploadGalleryImageAction(formData)` valida → sube a Supabase bucket `gallery` con path `gallery/[uuid].[ext]`
3. Crea `GalleryImage` en DB con `url` = URL pública, `order` = max(order) + 1
4. AuditLog `GALLERY_IMAGE_UPLOADED`

### Reorder
1. Admin arrastra y suelta imagen
2. `reorderGalleryAction(orderedIds)` actualiza el campo `order` de cada imagen

### Delete
1. Admin hace click en eliminar imagen
2. `deleteGalleryImageAction(id)` setea `deletedAt = new Date()`
3. AuditLog `GALLERY_IMAGE_DELETED`

## 7. REGLAS DE NEGOCIO

- RB-019: imágenes eliminadas pasan a Soft Delete (deletedAt)
- RB-020: AuditLog en upload y delete
- Formatos aceptados: JPEG, WebP (MIME: image/jpeg, image/webp)
- Tamaño máximo: 10MB
- Path en Supabase: `gallery/[uuid].[ext]`

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] Upload JPEG/WebP ≤10MB funciona
- [ ] Upload rechaza otros formatos con error
- [ ] Upload rechaza archivos >10MB con error
- [ ] Reorder actualiza el campo `order` de cada imagen
- [ ] Delete hace soft delete (no borra del storage, solo DB)
- [ ] AuditLog creado en upload y delete
- [ ] Tests pasan

## 9. EDGE CASES

- Archivo con MIME válido pero extensión incorrecta → validar MIME
- Sin sesión admin → error de auth
- ID de imagen inexistente en delete → error 404
- Array vacío en reorder → no-op válido

## 10. TESTS REQUERIDOS

- `tests/unit/admin/gallery-actions.test.ts`:
  - uploadGalleryImageAction: sin auth (error), formato inválido, >10MB, éxito + AuditLog
  - deleteGalleryImageAction: sin auth, imagen no existe, éxito + AuditLog
  - reorderGalleryAction: sin auth, éxito (actualiza ordenes)

## 11. DEPENDENCIAS

- #037 — Admin login ✅
- #012 — Supabase Storage ✅ (storage.ts creado en esta issue)

## 12. DEFINITION OF DONE

- [ ] Server Actions funcionan
- [ ] Tests pasan
- [ ] CI verde
- [ ] PR creado
- [ ] Issue cerrada
