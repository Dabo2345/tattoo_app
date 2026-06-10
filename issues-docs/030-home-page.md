# ISSUE DOC #030 — Página Home (/)

## CONTEXTO

La ruta `/` actualmente tiene un placeholder mínimo. Esta issue construye la página Home
completa como página de aterrizaje pública del estudio de tatuajes, siguiendo la filosofía
visual de UI-001 (Dark Modern Tattoo Studio) y los flujos definidos en UX-001.

La página es estática (Server Component puro) — no consume APIs. Las secciones dinámicas
(galería real, perfil artista) llegan en #031 y #032.

---

## OBJETIVO

Implementar `src/app/(public)/page.tsx` como página Home completa con:

1. **Hero** — headline, tagline y CTA primario "Reservar consulta"
2. **Sección "Cómo funciona"** — 3 pasos: Consulta → Diseño → Tatuaje
3. **Trabajos destacados** — grid estático de placeholders (preview, no consume API)
4. **Sección artista** — breve intro + enlace a /perfil
5. **CTA final** — sección de llamada a la acción hacia /reservar

---

## SCOPE

- `src/app/(public)/page.tsx` — página completa, reemplaza el placeholder
- `tests/unit/app/home.test.tsx` — tests unitarios de estructura y accesibilidad

---

## ANTI-SCOPE

- NO conectar a base de datos ni APIs (eso es #031/#032)
- NO añadir animaciones complejas fuera de la escala de 150-300ms permitida
- NO añadir componentes UI que no existan ya en main (solo `Button` disponible)
- NO modificar el layout, Navbar ni Footer (eso es #007, ya completado)
- NO añadir lógica de negocio

---

## ARCHIVOS AFECTADOS

| Archivo | Acción |
|---------|--------|
| `src/app/(public)/page.tsx` | Modificar — reemplaza placeholder |
| `tests/unit/app/home.test.tsx` | Crear — tests unitarios |

---

## FLUJO DE EJECUCIÓN

1. Crear rama `feature/030-home-page`
2. Implementar `page.tsx` con las 5 secciones
3. Escribir tests unitarios
4. Ejecutar suite completa: todos los tests deben pasar
5. Commit + push + PR body

---

## REGLAS DE NEGOCIO

- Server Component por defecto (sin `"use client"`)
- Mobile-first obligatorio (UI-001 §24)
- Tipografía: tokens `text-display`, `text-h1`, `text-h2`, `text-body-lg`, `text-body` (UI-001 §9)
- Paleta: bg-background, bg-surface, text-foreground, text-foreground-secondary (UI-001 §4-6)
- Botón CTA: `variant="default"` del componente `Button` existente
- Iconos: Lucide React únicamente (UI-001 §27)
- Imágenes: placeholders con `aspect-ratio` (las reales llegan en #031)
- Todos los links accesibles y navegables con teclado (WCAG AA)

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Hero visible con H1 que describe el estudio
- [ ] CTA "Reservar consulta" enlaza a `/reservar`
- [ ] Sección "Cómo funciona" con 3 pasos numerados/iconos
- [ ] Grid de trabajos destacados (placeholders) con enlace a `/galeria`
- [ ] Sección artista con enlace a `/perfil`
- [ ] CTA final enlaza a `/reservar`
- [ ] Page usa `export const metadata` con title y description apropiados
- [ ] Responsive: layout de 1 columna en mobile, multi-columna en desktop
- [ ] No hay errores de TypeScript ni ESLint
- [ ] Todos los tests pasan

---

## EDGE CASES

- Sin datos externos: toda la sección de "trabajos destacados" usa placeholders visuales
- La page no depende de ningún estado de sesión ni auth

---

## TESTS REQUERIDOS

### Unit (`tests/unit/app/home.test.tsx`)

| Test | Descripción |
|------|-------------|
| renders H1 | El heading principal está en el documento |
| hero CTA links to /reservar | El botón/link "Reservar consulta" apunta a /reservar |
| how-it-works section has 3 steps | Se renderizan exactamente 3 pasos |
| gallery teaser links to /galeria | El enlace "Ver galería" apunta a /galeria |
| artist section links to /perfil | El enlace de artista apunta a /perfil |
| final CTA links to /reservar | El CTA final apunta a /reservar |

---

## DEPENDENCIAS

- #028 completada (componentes UI base — Button disponible en main)
- #007 completada (Navbar, Footer, layout base)

---

## DEFINITION OF DONE

- [ ] `src/app/(public)/page.tsx` implementado y sin placeholder
- [ ] 6 tests unitarios pasando
- [ ] Suite completa verde
- [ ] PR creado contra `main`
- [ ] Sin errores TypeScript ni ESLint
