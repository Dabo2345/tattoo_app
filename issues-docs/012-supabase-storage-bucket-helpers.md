# ISSUE #012 — Supabase Storage: bucket de galería y helpers de upload

## Epic
EPIC 2 — Database & Auth

## Type
Task

## Priority
P0

## Dependencies
- #009 — Supabase conectado

---

## Contexto

Las imágenes de la galería del estudio se almacenan en Supabase Storage. El panel admin necesita poder subir, servir y eliminar imágenes. Esta issue crea el cliente de Supabase Storage en el backend y los helpers que usarán los Server Actions de galería (#043). Sin esto, la galería no puede funcionar.

---

## Objetivo

Configurar el cliente de Supabase Storage, crear el bucket de galería en Supabase y los helpers de upload/delete/URL que usan las Server Actions del admin.

---

## Scope

- Instalar `@supabase/supabase-js`
- Crear `/src/lib/supabase/storage.ts` con el cliente (usando Service Role Key)
- Crear el bucket `gallery` en Supabase (público para lectura, privado para escritura)
- Crear helpers: `uploadImage`, `deleteImage`, `getPublicUrl`
- Validación de formato (JPEG/WebP) y tamaño (máx 10MB)
- Lógica de generación de thumbnails (redimensionar a máx 400px de ancho)
- Estructura de paths en el bucket: `gallery/original/[uuid].[ext]` y `gallery/thumbs/[uuid].[ext]`

---

## Anti-scope

- No crear la UI de upload del admin (eso es #043)
- No crear los Server Actions (eso es #043)
- No gestionar las entradas en la tabla `GalleryImage` (eso es el Service, en #043)
- No acceder al storage desde el frontend (solo backend)

---

## Archivos afectados

```
src/lib/supabase/
  storage.ts              ← CREAR
  client.ts               ← CREAR (cliente base de Supabase)
```

---

## Flujo de ejecución

1. Crear rama `feature/012-supabase-storage` desde `develop`
2. Instalar: `pnpm add @supabase/supabase-js`
3. Crear `/src/lib/supabase/client.ts` con el cliente base
4. Crear bucket `gallery` en Supabase Dashboard (Storage → New bucket)
   - Nombre: `gallery`
   - Public bucket: SÍ (las imágenes son públicas para los visitantes)
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg`, `image/webp`
5. Crear `/src/lib/supabase/storage.ts` con los helpers
6. Probar upload de una imagen de prueba localmente
7. `pnpm typecheck && pnpm lint`
8. Crear PR a `develop`

---

## Implementación

### /src/lib/supabase/client.ts

```typescript
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

/**
 * Cliente de Supabase con Service Role Key.
 * SOLO para uso en el servidor (Server Actions, Route Handlers).
 * NUNCA exportar al cliente.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

### /src/lib/supabase/storage.ts

```typescript
import { supabaseAdmin } from "./client"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { InternalError } from "@/lib/api/errors"

const GALLERY_BUCKET = "gallery"
const MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/webp"] as const

type AllowedMimeType = (typeof ALLOWED_TYPES)[number]

// ─── Validación ───────────────────────────────────────────────────────────────

export function validateImageFile(file: File): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "La imagen no puede superar los 10MB" }
  }
  if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return { valid: false, error: "Solo se permiten imágenes JPEG o WebP" }
  }
  return { valid: true }
}

// ─── Upload ───────────────────────────────────────────────────────────────────

interface UploadResult {
  originalUrl: string
  thumbnailUrl: string
  storagePath: string
  thumbPath: string
}

export async function uploadGalleryImage(
  file: File,
  imageId: string
): Promise<UploadResult> {
  const ext = file.type === "image/webp" ? "webp" : "jpg"
  const originalPath = `gallery/original/${imageId}.${ext}`
  const thumbPath = `gallery/thumbs/${imageId}.${ext}`

  // Upload original
  const { error: uploadError } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .upload(originalPath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    logger.error({ error: uploadError, imageId }, "Failed to upload image to Supabase Storage")
    throw new InternalError("Error al subir la imagen")
  }

  // Generar thumbnail (en MVP: subir misma imagen como thumb, resize en futuro)
  // En una implementación real se usaría sharp o canvas para redimensionar
  const thumbBuffer = await file.arrayBuffer()
  const { error: thumbError } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .upload(thumbPath, thumbBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (thumbError) {
    // Si falla el thumb, eliminar el original (rollback manual)
    await supabaseAdmin.storage.from(GALLERY_BUCKET).remove([originalPath])
    throw new InternalError("Error al generar el thumbnail")
  }

  const { data: originalUrlData } = supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(originalPath)

  const { data: thumbUrlData } = supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(thumbPath)

  return {
    originalUrl: originalUrlData.publicUrl,
    thumbnailUrl: thumbUrlData.publicUrl,
    storagePath: originalPath,
    thumbPath,
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteGalleryImages(
  storagePath: string,
  thumbPath: string
): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .remove([storagePath, thumbPath])

  if (error) {
    logger.error({ error, storagePath }, "Failed to delete images from Supabase Storage")
    // No lanzar excepción — el soft delete en DB ya ocurrió
    // El archivo en Storage puede limpiarse manualmente si falla
  }
}

// ─── URL pública ──────────────────────────────────────────────────────────────

export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from(GALLERY_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
```

---

## Configuración del bucket en Supabase

Política RLS del bucket `gallery`:
- **Lectura pública**: Todos pueden leer (las imágenes son públicas)
- **Escritura**: Solo el Service Role Key (backend) puede escribir/eliminar

Esto se configura en Supabase Dashboard → Storage → Policies.

---

## Reglas del sistema aplicables

- ADR-001: Supabase Storage para galería y fotos
- FRONT-001: Upload flujo: Cliente → Server Action → Supabase Storage
- UI-001: Formatos JPEG/WebP obligatorios, lazy loading y imágenes responsivas
- AUTH-001: `SUPABASE_SERVICE_ROLE_KEY` solo en backend, nunca al cliente
- NOTIF-001: Máximo 10MB por imagen

---

## Criterios de aceptación

- [ ] Bucket `gallery` existe en Supabase con las políticas correctas
- [ ] `uploadGalleryImage` sube una imagen y devuelve las URLs correctas
- [ ] `validateImageFile` rechaza archivos >10MB con mensaje apropiado
- [ ] `validateImageFile` rechaza formatos distintos a JPEG/WebP
- [ ] `deleteGalleryImages` elimina los archivos del bucket
- [ ] Las URLs devueltas por `getPublicUrl` son accesibles públicamente
- [ ] El cliente Supabase admin NUNCA se expone al frontend
- [ ] `pnpm typecheck` pasa

---

## Edge cases

- Si el upload del original tiene éxito pero el thumb falla: rollback del original (ya implementado)
- Si el bucket no existe: el upload falla con error de Supabase → `InternalError`
- Supabase Storage tiene límite de 50MB en plan free: las imágenes de 10MB máximo están dentro del límite
- Los paths de Storage deben ser únicos: usar el `imageId` (UUID) del registro de DB como nombre

---

## Tests requeridos

```typescript
// tests/unit/lib/supabase/storage.test.ts
import { validateImageFile } from "@/lib/supabase/storage"

describe("validateImageFile", () => {
  it("rechaza archivos mayores de 10MB", () => {
    const file = new File(["x".repeat(11 * 1024 * 1024)], "test.jpg", { type: "image/jpeg" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
  })

  it("rechaza formatos distintos a JPEG y WebP", () => {
    const file = new File(["content"], "test.png", { type: "image/png" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
  })

  it("acepta JPEG dentro del límite de tamaño", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })

  it("acepta WebP dentro del límite de tamaño", () => {
    const file = new File(["content"], "test.webp", { type: "image/webp" })
    const result = validateImageFile(file)
    expect(result.valid).toBe(true)
  })
})
```

---

## Definition of Done

- [ ] Bucket `gallery` creado en Supabase con políticas correctas
- [ ] `/src/lib/supabase/client.ts` y `/src/lib/supabase/storage.ts` creados
- [ ] `validateImageFile`, `uploadGalleryImage`, `deleteGalleryImages` funcionando
- [ ] Tests unitarios de validación creados y pasando
- [ ] `pnpm typecheck` pasa
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
