# ISSUE DOC #065 — Fix: home page muestra galería real y datos del artista desde BD

## 1. CONTEXTO

La home page (`/`) tiene dos secciones con datos hardcodeados que deberían ser dinámicos:

1. **"Trabajos destacados"**: muestra 6 placeholders vacíos (`FEATURED_PLACEHOLDERS`)
   en lugar de imágenes reales de la galería.
2. **"El artista detrás del estudio"**: texto completamente hardcodeado en el JSX,
   no conectado al `ArtistProfile` de BD que el admin ya gestiona.

## 2. OBJETIVO

Actualizar la home page para mostrar datos reales de BD, de forma consistente con
el resto de páginas públicas una vez resuelta la issue #064.

## 3. SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/(public)/page.tsx` | Modificar — leer galería y perfil artista de BD |

## 4. ANTI-SCOPE

- No modificar el diseño/layout existente de la home
- No añadir paginación ni filtros a la galería destacada (máx 6 imágenes)
- No modificar otras secciones de la home (hero, cómo funciona, CTA)

## 5. FLUJO DE EJECUCIÓN

1. Convertir `HomePage` en async Server Component
2. **Sección galería**:
   - Consultar `prisma.galleryImage.findMany({ where: { deletedAt: null }, orderBy: { order: 'asc' }, take: 6 })`
   - Si hay imágenes → mostrarlas con `next/image`
   - Si no hay imágenes → mantener los placeholders vacíos actuales (graceful fallback)
3. **Sección artista**:
   - Consultar `prisma.artistProfile.findUnique({ where: { id: ARTIST_PROFILE_ID } })`
   - Mostrar `name`, `bio` (primeros 300 chars aprox), `specialties`
   - Si no existe → mantener texto placeholder actual

## 6. REGLAS DE NEGOCIO

- `ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"`
- Imágenes de galería: solo las que tienen `deletedAt: null`, ordenadas por `order ASC`
- Máximo 6 imágenes en la home (sección destacados)
- La página no debe romper si no hay datos en BD

## 7. CRITERIOS DE ACEPTACIÓN

- [ ] La sección "Trabajos destacados" muestra imágenes reales si existen en BD
- [ ] Si no hay imágenes en BD, la sección muestra placeholders (sin errores)
- [ ] La sección "El artista" muestra el nombre y bio de BD
- [ ] Subir una imagen nueva en `/admin/gallery` → aparece en home al recargar
- [ ] Editar el perfil en `/admin/content` → se refleja en home al recargar

## 8. TESTS REQUERIDOS

- No se requieren tests adicionales (la lógica es solo consulta + render)

## 9. DEPENDENCIAS

- #064 (debe completarse antes — establece el patrón de lectura de BD)
- #043 (completada) — GalleryImage ya existe en BD
- #044 (completada) — ArtistProfile ya existe en BD

## 10. DEFINITION OF DONE

- [ ] Home muestra datos reales de BD
- [ ] Fallback correcto si no hay datos
- [ ] CI verde
- [ ] PR creado
