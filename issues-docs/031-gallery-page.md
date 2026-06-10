# ISSUE DOC #031 — Página Galería (/galeria) + API GET /api/gallery

## CONTEXTO

La ruta `/galeria` tiene un placeholder. Esta issue construye la galería completa:
la API que expone las imágenes desde la BD y la página pública con grid masonry y lightbox,
tal como define UI-001 §17.

---

## OBJETIVO

1. **`GET /api/gallery`** — devuelve `GalleryImage[]` (no eliminadas, ordenadas por `order`)
   con filtro opcional `?tag=slug`
2. **`/galeria`** — página Server Component que muestra la galería con:
   - Filtros por StyleTag (client-side)
   - Grid masonry 2/3/4 columnas (mobile/tablet/desktop)
   - Lightbox al hacer click en imagen
   - Estado vacío

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/modules/gallery/types/index.ts` | Crear — tipos TypeScript |
| `src/modules/gallery/repositories/gallery-repository.ts` | Crear — acceso a DB |
| `src/app/api/gallery/route.ts` | Crear — GET /api/gallery |
| `src/modules/gallery/components/gallery-grid.tsx` | Crear — grid + lightbox (client) |
| `src/app/(public)/galeria/page.tsx` | Modificar — reemplaza placeholder |
| `tests/unit/app/api/gallery.test.ts` | Crear — tests API |
| `tests/unit/modules/gallery/gallery-grid.test.tsx` | Crear — tests componente |

---

## ANTI-SCOPE

- NO upload de imágenes (eso es #043)
- NO paginación (MVP con todas las imágenes activas)
- NO autenticación en este endpoint (es público)
- NO modificar next.config.ts (usar `<img>` con lazy loading)

---

## FLUJO DE EJECUCIÓN

1. Crear tipos en `gallery/types`
2. Crear repository con `findAll(tagSlug?)` y `findAllTags()`
3. Crear `GET /api/gallery` que llama al repository
4. Crear `GalleryGrid` client component (grid masonry + lightbox)
5. Actualizar `galeria/page.tsx` como Server Component async
6. Escribir y ejecutar tests
7. Commit + push + PR

---

## REGLAS DE NEGOCIO

- Solo imágenes con `deletedAt IS NULL`
- Ordenadas por `order ASC`
- Filtro `?tag=slug` usa `styleTags: { some: { slug } }`
- Respuesta: `{ success: true, data: GalleryImage[] }` / `{ success: false, error: string }`
- La página pasa la lista completa al cliente (filtrado client-side por tag)
- Lightbox: close en ESC, backdrop click, botón cerrar (UI-001 §20)

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `GET /api/gallery` devuelve 200 con array (puede estar vacío)
- [ ] `GET /api/gallery?tag=slug` filtra por StyleTag
- [ ] Error de BD → 500 con `{ success: false, error }`
- [ ] Página renderiza H1 "Galería"
- [ ] Grid masonry con columnas responsivas
- [ ] Estado vacío si no hay imágenes
- [ ] Click imagen abre lightbox
- [ ] Lightbox se cierra con ESC / backdrop / botón
- [ ] Todos los tests pasan

---

## TESTS REQUERIDOS

### Unit API (`tests/unit/app/api/gallery.test.ts`)
- GET devuelve 200 y array
- GET ?tag= pasa parámetro al repository
- GET cuando DB falla → 500

### Unit Component (`tests/unit/modules/gallery/gallery-grid.test.tsx`, happy-dom)
- Renderiza imágenes
- Estado vacío cuando array vacío
- Click imagen abre lightbox
- Click backdrop cierra lightbox
- Click botón cerrar cierra lightbox

---

## DEPENDENCIAS

- #028 completada (Button disponible)
- #012 completada (Supabase Storage — modelo GalleryImage ya en schema Prisma #008)

---

## DEFINITION OF DONE

- [ ] Todos los archivos del SCOPE creados/modificados
- [ ] Tests pasando
- [ ] Suite completa verde
- [ ] PR creado contra `main`
