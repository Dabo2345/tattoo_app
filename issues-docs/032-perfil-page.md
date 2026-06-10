# ISSUE DOC #032 — Página Perfil artista (/perfil) + API GET /api/content/profile

## CONTEXTO

La ruta `/perfil` tiene un placeholder. El perfil del artista es contenido estático para el MVP
(no existe modelo en BD todavía — eso llega en #044 Admin). Esta issue:
1. Define los tipos de `ArtistProfile`
2. Crea datos estáticos editables en `src/modules/content/data/`
3. Expone `GET /api/content/profile`
4. Construye la página `/perfil` como Server Component

---

## OBJETIVO

- **`GET /api/content/profile`** — devuelve datos del perfil artista desde datos estáticos
- **`/perfil`** — página pública con hero, bio, especialidades y CTA a `/reservar`

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/modules/content/types/index.ts` | Crear — tipos TypeScript |
| `src/modules/content/data/artist-profile.ts` | Crear — datos estáticos editables |
| `src/app/api/content/profile/route.ts` | Crear — GET /api/content/profile |
| `src/app/(public)/perfil/page.tsx` | Modificar — reemplaza placeholder |
| `tests/unit/app/api/content-profile.test.ts` | Crear — test API |
| `tests/unit/app/perfil.test.tsx` | Crear — test página |

---

## ANTI-SCOPE

- NO persistencia en BD (eso es #044)
- NO formulario de edición
- NO autenticación en este endpoint (público)
- NO modificar schema Prisma

---

## FLUJO DE EJECUCIÓN

1. Crear tipos `ArtistProfile`
2. Crear `artist-profile.ts` con datos estáticos
3. Crear `GET /api/content/profile`
4. Implementar `/perfil` como Server Component
5. Tests y suite verde
6. Commit + push + PR

---

## REGLAS DE NEGOCIO

- Los datos del perfil son estáticos en el MVP
- La API devuelve `{ success: true, data: ArtistProfile }`
- La página accede a los datos directamente (Server Component), no via fetch HTTP
- Mobile-first, tokens UI-001

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `GET /api/content/profile` devuelve 200 con datos del artista
- [ ] Página renderiza H1 con nombre del artista
- [ ] Sección bio visible
- [ ] Especialidades listadas
- [ ] CTA "Reservar consulta" → /reservar
- [ ] Todos los tests pasan

---

## TESTS REQUERIDOS

### Unit API (`tests/unit/app/api/content-profile.test.ts`)
- GET devuelve 200 con datos del perfil
- Respuesta tiene estructura `{ success: true, data }`

### Unit Page (`tests/unit/app/perfil.test.tsx`, happy-dom)
- Renderiza H1 con nombre artista
- Renderiza sección bio
- CTA "Reservar consulta" → /reservar

---

## DEPENDENCIAS

- #028 completada (Button disponible)
- #007 completada (layout base)

---

## DEFINITION OF DONE

- [ ] Todos los archivos del SCOPE creados/modificados
- [ ] Tests pasando
- [ ] Suite completa verde
- [ ] PR creado contra `main`
