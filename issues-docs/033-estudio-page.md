# ISSUE DOC #033 — Página Estudio (/estudio) + API GET /api/content/studio

## CONTEXTO

La ruta `/estudio` tiene un placeholder. Esta issue construye la página de información del
estudio (dirección, horarios, contacto, qué esperar el día de la cita) siguiendo el mismo
patrón estático de #032. La edición admin llega en #044.

---

## OBJETIVO

- **`GET /api/content/studio`** — datos estáticos del estudio
- **`/estudio`** — página pública con información práctica: ubicación, horario, contacto, proceso

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/modules/content/types/index.ts` | Modificar — añadir `StudioInfo` |
| `src/modules/content/data/studio-info.ts` | Crear — datos estáticos |
| `src/app/api/content/studio/route.ts` | Crear — GET /api/content/studio |
| `src/app/(public)/estudio/page.tsx` | Modificar — reemplaza placeholder |
| `tests/unit/app/api/content-studio.test.ts` | Crear — test API |
| `tests/unit/app/estudio.test.tsx` | Crear — test página |

---

## ANTI-SCOPE

- NO persistencia en BD (eso es #044)
- NO autenticación en este endpoint (público)
- NO modificar schema Prisma

---

## REGLAS DE NEGOCIO

- Datos estáticos en MVP, editables en #044
- Respuesta: `{ success: true, data: StudioInfo }`
- Server Component sin fetch HTTP propio (accede a datos directamente)

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `GET /api/content/studio` devuelve 200 con datos del estudio
- [ ] Página renderiza H1 con nombre del estudio
- [ ] Dirección y horario visibles
- [ ] CTA "Reservar consulta" → /reservar
- [ ] Todos los tests pasan

---

## DEPENDENCIAS

- #028 completada (Button disponible)
- #032 completada (patrón content module establecido)

---

## DEFINITION OF DONE

- [ ] Archivos creados/modificados
- [ ] Tests pasando
- [ ] Suite completa verde
- [ ] PR creado contra `main`
