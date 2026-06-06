# Skill: gallery

## Propósito

Guía de referencia rápida para el módulo de galería.

---

## Stack

- **Storage**: Supabase Storage
- **Módulo**: `/src/modules/gallery/`
- **APIs públicas**: `GET /api/gallery`, `GET /api/gallery/:id`
- **Server Actions** (admin): `uploadGalleryImageAction`, `deleteGalleryImageAction`, `reorderGalleryAction`

---

## Flujo de upload de imagen

```
Admin selecciona imagen en UI
        ↓
Server Action: uploadGalleryImageAction(formData)
        ↓
Validar: tamaño máx 10MB, formato JPEG o WebP
        ↓
Subir imagen original a Supabase Storage
        ↓
Generar thumbnail (redimensionar)
        ↓
Subir thumbnail a Supabase Storage
        ↓
Crear registro GalleryImage en DB con:
  - url (imagen original)
  - thumbnailUrl
  - styleTags
  - orden
        ↓
Retornar imageId al cliente
```

---

## Reglas críticas

- Formatos permitidos: JPEG y WebP únicamente
- Tamaño máximo: 10MB por imagen
- Generar siempre thumbnail (obligatorio para performance)
- Las imágenes eliminadas van a soft delete (deletedAt), nunca borrado físico (RB-019)
- Supabase Storage solo es accesible desde backend (Service Role Key)
- Imágenes públicas: se sirven via URL pública de Supabase Storage (sin auth)

---

## Filtros de galería

La API soporta filtro por styleTag:

```
GET /api/gallery?styleTag=realismo
GET /api/gallery?styleTag=blackwork
GET /api/gallery  ← todos los estilos
```

---

## Soft delete

```typescript
// Nunca borrar físicamente
await galleryRepository.softDelete(imageId)
// Esto establece deletedAt = now()
// La imagen desaparece del GET /api/gallery automáticamente
// porque el query filtra WHERE deletedAt IS NULL
```

---

## Reordenar galería

El admin puede arrastrar y soltar para reordenar. El orden se guarda como campo `order` numérico:

```typescript
await reorderGalleryAction(imageIds) // Array de IDs en el nuevo orden
// Actualiza el campo `order` de cada imagen según su posición en el array
```

---

## Acceso al Storage en código

```typescript
import { supabaseStorage } from "@/lib/supabase/storage"

// Upload
const { url } = await supabaseStorage.upload(bucket, path, file)

// Delete (solo para limpieza, el registro en DB hace soft delete)
await supabaseStorage.remove(bucket, [path])
```

---

## Testing

- Mockear Supabase Storage en tests (no subir archivos reales)
- Verificar validación de formato y tamaño
- Verificar que el soft delete funciona (imagen no aparece en API pública)
- Verificar que el reorden actualiza el campo `order` correctamente
