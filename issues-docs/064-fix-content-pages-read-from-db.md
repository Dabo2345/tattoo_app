# ISSUE DOC #064 — Fix: páginas públicas y APIs de contenido leen de BD, no de archivos estáticos

## 1. CONTEXTO

Las issues #032, #033 y #044 se implementaron pero quedaron desconectadas entre sí.
El admin panel (#044) guarda `ArtistProfile` y `StudioInfo` en la BD correctamente.
Sin embargo, las páginas públicas `/perfil` y `/estudio`, y las APIs `GET /api/content/profile`
y `GET /api/content/studio`, siguen importando datos hardcodeados de:

- `src/modules/content/data/artist-profile.ts`
- `src/modules/content/data/studio-info.ts`

Por eso los cambios del admin nunca se reflejan en la vista del usuario.

## 2. OBJETIVO

Conectar las páginas públicas y sus APIs con los modelos de BD (`ArtistProfile`, `StudioInfo`)
que ya existen en Prisma y que el admin ya gestiona correctamente.

## 3. SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/api/content/profile/route.ts` | Modificar — leer de `prisma.artistProfile` en vez de archivo estático |
| `src/app/api/content/studio/route.ts` | Modificar — leer de `prisma.studioInfo` en vez de archivo estático |
| `src/app/(public)/perfil/page.tsx` | Modificar — consultar BD directamente (Server Component) |
| `src/app/(public)/estudio/page.tsx` | Modificar — consultar BD directamente (Server Component) |
| `src/modules/content/data/artist-profile.ts` | Eliminar (ya no se usa) |
| `src/modules/content/data/studio-info.ts` | Eliminar (ya no se usa) |

## 4. ANTI-SCOPE

- No modificar el admin panel (ya funciona correctamente)
- No cambiar el schema de Prisma
- No añadir subida de foto de perfil del artista

## 5. FLUJO DE EJECUCIÓN

1. Modificar `GET /api/content/profile`:
   - `prisma.artistProfile.findUnique({ where: { id: ARTIST_PROFILE_ID } })`
   - Si no existe → devolver 404
2. Modificar `GET /api/content/studio`:
   - `prisma.studioInfo.findUnique({ where: { id: STUDIO_INFO_ID } })`
   - Si no existe → devolver 404
3. Modificar `/perfil/page.tsx`:
   - Eliminar import del archivo estático
   - Consultar BD con Prisma directamente (es Server Component, puede usar prisma)
   - Si no existe registro → mostrar datos vacíos o mensaje de "próximamente"
4. Modificar `/estudio/page.tsx`:
   - Igual que `/perfil`
5. Eliminar los archivos estáticos `artist-profile.ts` y `studio-info.ts`
6. Verificar que no queda ningún import de esos archivos en el proyecto

## 6. REGLAS DE NEGOCIO

- Los singletons tienen IDs fijos:
  - `ARTIST_PROFILE_ID = "00000000-0000-0000-0000-000000000001"`
  - `STUDIO_INFO_ID = "00000000-0000-0000-0000-000000000002"`
- Si el registro no existe en BD (antes del seed), la página debe renderizar sin errores

## 7. CRITERIOS DE ACEPTACIÓN

- [ ] Modificar el nombre del artista en el admin → `/perfil` refleja el cambio al recargar
- [ ] Modificar el estudio en el admin → `/estudio` refleja el cambio al recargar
- [ ] `GET /api/content/profile` devuelve datos de BD
- [ ] `GET /api/content/studio` devuelve datos de BD
- [ ] No existen imports de los archivos estáticos eliminados
- [ ] La página no rompe si no existe registro en BD

## 8. TESTS REQUERIDOS

- Unit test: `GET /api/content/profile` devuelve datos de BD / 404 si no existe
- Unit test: `GET /api/content/studio` devuelve datos de BD / 404 si no existe

## 9. DEPENDENCIAS

- #044 (completada) — ArtistProfile y StudioInfo ya existen en BD

## 10. DEFINITION OF DONE

- [ ] APIs leen de BD
- [ ] Páginas públicas leen de BD
- [ ] Archivos estáticos eliminados
- [ ] Tests añadidos
- [ ] CI verde
- [ ] PR creado
