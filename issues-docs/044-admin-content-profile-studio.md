# ISSUE DOC — #044 Admin: editar perfil artista y studio info

## 1. CONTEXTO

El panel admin necesita permitir al artista editar su perfil público (nombre, bio, especialidades, redes sociales, foto de perfil) y la información del estudio (nombre, descripción, dirección, contacto). Estos datos se muestran públicamente en `/perfil` y `/estudio` (issues #032 y #033), y se sirven vía `GET /api/content/profile` y `GET /api/content/studio` (API-001 §8).

El esquema Prisma actual no tiene modelos para estos datos de contenido. Esta issue los añade como singletons (siempre existe un único registro de cada uno, creado en el seed).

## 2. OBJETIVO

Implementar la página `/admin/content` con dos formularios: uno para el perfil del artista y otro para la información del estudio. Datos persistidos en BD via Server Actions. AuditLog en cada actualización (RB-020).

## 3. SCOPE

### Prisma
- Añadir modelo `ArtistProfile` a `prisma/schema.prisma`
- Añadir modelo `StudioInfo` a `prisma/schema.prisma`
- Crear migración: `prisma migrate dev --name add-content-models`
- Actualizar `prisma/seed.ts` para crear el registro singleton de cada modelo si no existe

### Server Actions — `src/app/admin/content/actions.ts`
- `updateArtistProfileAction(data)`: valida con Zod → upsert `ArtistProfile` → AuditLog `ARTIST_PROFILE_UPDATED`
- `updateStudioInfoAction(data)`: valida con Zod → upsert `StudioInfo` → AuditLog `STUDIO_INFO_UPDATED`

### Página admin
- `src/app/admin/content/page.tsx`: Server Component que carga ambos registros y renderiza los formularios
- `src/components/admin/artist-profile-form.tsx`: Client Component, formulario de perfil artista
- `src/components/admin/studio-info-form.tsx`: Client Component, formulario de información del estudio

### Tests
- `tests/unit/admin/content-actions.test.ts`

## 4. ANTI-SCOPE

- Subida de foto de perfil del artista (requiere Supabase Storage — issue separada)
- APIs públicas `GET /api/content/profile` y `GET /api/content/studio` (issues #032 y #033)
- Gestión de horarios laborales o depósito (issue #045)
- Edición de StyleTags

## 5. ARCHIVOS AFECTADOS

- `issues-docs/044-admin-content-profile-studio.md` (nuevo)
- `prisma/schema.prisma` (modificado — añadir ArtistProfile y StudioInfo)
- `prisma/seed.ts` (modificado — crear singletons)
- `src/app/admin/content/actions.ts` (nuevo)
- `src/app/admin/content/page.tsx` (modificado — reemplazar stub)
- `src/components/admin/artist-profile-form.tsx` (nuevo)
- `src/components/admin/studio-info-form.tsx` (nuevo)
- `tests/unit/admin/content-actions.test.ts` (nuevo)

## 6. FLUJO DE EJECUCIÓN

### Editar perfil artista
1. Admin accede a `/admin/content`
2. Formulario se pre-carga con datos actuales de `ArtistProfile`
3. Admin edita campos y pulsa "Guardar perfil"
4. `updateArtistProfileAction(data)` valida Zod → upsert en BD → AuditLog
5. UI muestra mensaje de éxito

### Editar info del estudio
1. Mismo flujo en el segundo formulario con `updateStudioInfoAction(data)`

## 7. MODELOS PRISMA

### ArtistProfile (singleton)

```prisma
model ArtistProfile {
  id                 String   @id @default(uuid())
  name               String
  bio                String   @db.Text
  specialties        String[] // array de strings
  instagramHandle    String?
  yearsOfExperience  Int?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@map("artist_profile")
}
```

### StudioInfo (singleton)

```prisma
model StudioInfo {
  id             String   @id @default(uuid())
  name           String
  description    String   @db.Text
  address        String
  city           String
  phone          String
  email          String
  instagramHandle String?
  googleMapsUrl   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("studio_info")
}
```

## 8. SCHEMAS ZOD

### updateArtistProfileAction

```ts
z.object({
  name: z.string().min(1).max(100),
  bio: z.string().min(1).max(2000),
  specialties: z.array(z.string().min(1).max(50)).min(1).max(10),
  instagramHandle: z.string().max(50).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
})
```

### updateStudioInfoAction

```ts
z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().email().max(100),
  instagramHandle: z.string().max(50).optional(),
  googleMapsUrl: z.string().url().optional(),
})
```

## 9. REGLAS DE NEGOCIO

- RB-020: toda acción administrativa relevante genera un AuditLog
- Patrón singleton: cada modelo tiene exactamente un registro en BD; si no existe se crea (upsert con `where: { id: SINGLETON_ID }`)
- El `SINGLETON_ID` es una constante UUIDv4 fija definida en el módulo: `ARTIST_PROFILE_ID` y `STUDIO_INFO_ID`
- Las Server Actions requieren sesión admin válida (verificar con `auth.api.getSession`)
- Nunca exponer errores internos al cliente

## 10. CRITERIOS DE ACEPTACIÓN

- [ ] `ArtistProfile` y `StudioInfo` existen en el schema Prisma
- [ ] Migración aplicada sin errores
- [ ] Seed crea ambos singletons si no existen
- [ ] `updateArtistProfileAction` actualiza el perfil y genera AuditLog
- [ ] `updateStudioInfoAction` actualiza la info del estudio y genera AuditLog
- [ ] Validación Zod rechaza datos inválidos con mensaje descriptivo
- [ ] Sin sesión admin → error de autenticación
- [ ] Formularios muestran estado loading/success/error (UX-001 §15)
- [ ] Formularios se pre-cargan con datos actuales
- [ ] Tests pasan

## 11. EDGE CASES

- Singleton no existe en BD (primera carga antes de seed) → upsert lo crea
- `specialties` array vacío enviado desde cliente → Zod lo rechaza (min(1))
- `googleMapsUrl` con URL malformada → Zod rechaza con `z.string().url()`
- Sin sesión admin → error retornado con formato `{ success: false, error: { code: "UNAUTHORIZED", message: "..." } }`
- Campo `instagramHandle` con o sin `@` prefijo → normalizar en Server Action quitando `@` si viene incluido

## 12. TESTS REQUERIDOS

`tests/unit/admin/content-actions.test.ts`:

**updateArtistProfileAction:**
- sin sesión → retorna error UNAUTHORIZED
- datos inválidos (bio vacía) → retorna error VALIDATION_ERROR
- datos válidos → upsert en BD + AuditLog creado
- `instagramHandle` con `@` prefijo → normalizado (sin `@`)

**updateStudioInfoAction:**
- sin sesión → retorna error UNAUTHORIZED
- email inválido → retorna error VALIDATION_ERROR
- `googleMapsUrl` malformada → retorna error VALIDATION_ERROR
- datos válidos → upsert en BD + AuditLog creado

## 13. DEPENDENCIAS

- #037 — Admin login ✅

## 14. DEFINITION OF DONE

- [ ] Modelos Prisma añadidos y migración creada
- [ ] Seed actualizado
- [ ] Server Actions implementadas con validación Zod
- [ ] Página `/admin/content` funcional con ambos formularios
- [ ] AuditLog generado en cada actualización
- [ ] Tests pasan
- [ ] CI verde
- [ ] PR creado con descripción completa
- [ ] Issue cerrada
