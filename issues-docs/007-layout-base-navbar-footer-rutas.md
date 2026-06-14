# ISSUE #007 — Layout base: Navbar, Footer y sistema de rutas App Router

## Epic
EPIC 1 — System Foundation

## Type
Task

## Priority
P0

## Dependencies
- #006 — TailwindCSS y tokens UI-001 configurados

---

## Contexto

Con el sistema de diseño configurado, es necesario establecer la estructura de navegación base del proyecto. Esto incluye el layout público (Navbar + Footer), el layout del admin (sidebar/header de admin), y las rutas de la aplicación con sus páginas placeholder. Sin esta estructura, no se puede construir ninguna página de contenido.

---

## Objetivo

Crear la estructura de layouts, páginas placeholder y sistema de rutas del App Router de Next.js 15, siguiendo la arquitectura de FRONT-001 y los flujos de UX-001.

---

## Scope

- Crear layout público con Navbar y Footer reales (diseño completo de UI-001)
- Crear layout admin (header + protección de ruta via redirect)
- Crear páginas placeholder para todas las rutas públicas y admin
- Crear el componente Navbar con navegación mobile (hamburger) y desktop
- Crear el componente Footer con datos del estudio
- Implementar navegación entre páginas con `next/link`
- Configurar metadata global (`generateMetadata` base)

---

## Anti-scope

- No rellenar el contenido real de las páginas (eso es Epic 5 y Epic 6)
- No implementar Better Auth en el layout admin (eso es #010)
- No crear componentes de formulario o booking

---

## Archivos afectados

```
src/app/
  layout.tsx                      ← MODIFICAR (metadata global)
  (public)/
    layout.tsx                    ← CREAR (layout con Navbar + Footer)
    page.tsx                      ← CREAR (Home placeholder)
    galeria/
      page.tsx                    ← CREAR (placeholder)
    perfil/
      page.tsx                    ← CREAR (placeholder)
    estudio/
      page.tsx                    ← CREAR (placeholder)
    reservar/
      page.tsx                    ← CREAR (placeholder)
    magic-link/
      [token]/
        page.tsx                  ← CREAR (placeholder)
    session-link/
      [token]/
        page.tsx                  ← CREAR (placeholder)
  admin/
    layout.tsx                    ← CREAR (layout admin sin auth todavía)
    page.tsx                      ← CREAR (dashboard placeholder)
    login/
      page.tsx                    ← CREAR (login placeholder)
    appointments/
      page.tsx                    ← CREAR
    gallery/
      page.tsx                    ← CREAR
    content/
      page.tsx                    ← CREAR
    settings/
      page.tsx                    ← CREAR
src/components/
  layout/
    navbar.tsx                    ← CREAR
    navbar-mobile.tsx             ← CREAR
    footer.tsx                    ← CREAR
    admin-header.tsx              ← CREAR
```

---

## Flujo de ejecución

1. Crear rama `feature/007-layout-base` desde `develop`
2. Instalar `lucide-react` para iconos (hamburger menu, etc.)
3. Crear componente `Navbar` con links de navegación pública
4. Crear componente `NavbarMobile` con menú hamburger
5. Crear componente `Footer` con datos del estudio
6. Crear layout `(public)/layout.tsx` que incluye Navbar y Footer
7. Crear páginas placeholder en todas las rutas públicas
8. Crear componente `AdminHeader`
9. Crear layout `admin/layout.tsx` (sin auth todavía — solo estructura)
10. Crear páginas placeholder del admin
11. Actualizar metadata global en `app/layout.tsx`
12. Verificar navegación entre páginas manualmente
13. `pnpm build && pnpm typecheck && pnpm lint`
14. Crear PR a `develop`

---

## Diseño del Navbar (UI-001)

```
Desktop:
[Logo/Nombre] ←————————————————————————→ [Galería] [Perfil] [Estudio] [Reservar →]

Mobile:
[Logo/Nombre] ←——————————————————————→ [☰]
```

Colores según UI-001:
- Background del navbar: `bg-background` con `border-b border-border`
- Links: `text-foreground-secondary hover:text-foreground`
- Botón "Reservar": botón primario con `bg-accent hover:bg-accent-hover`
- Mobile: dropdown sobre fondo `bg-surface`

## Diseño del Footer (UI-001)

```
[Dirección del estudio]    [Email]    [Teléfono]    [Instagram]
──────────────────────────────────────────────────────────────
© 2026 Nombre del Estudio. Todos los derechos reservados.
```

---

## Estructura de navegación pública (UX-001)

| Ruta | Título | Descripción |
|------|--------|-------------|
| `/` | Inicio | Landing page del estudio |
| `/galeria` | Galería | Portfolio de trabajos |
| `/perfil` | Artista | Perfil del artista |
| `/estudio` | Estudio | Información del local |
| `/reservar` | Reservar Consulta | Sistema de reservas |

---

## Metadata global (SEO base)

```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "Estudio de Tatuajes",
    template: "%s | Estudio de Tatuajes",
  },
  description: "Estudio de tatuajes profesional. Reserva tu consulta online.",
  robots: {
    index: true,
    follow: true,
  },
}
```

---

## Reglas del sistema aplicables

- UI-001: Navbar fixed desktop, hamburger mobile, Footer con datos de contacto
- UX-001: Navegación pública: /, /galeria, /perfil, /estudio, /reservar
- FRONT-001: Server Components por defecto, "use client" solo para el menú mobile interactivo
- FRONT-001: Nombrado PascalCase para componentes, kebab-case para archivos

---

## Criterios de aceptación

- [ ] Navbar visible en todas las páginas públicas con links de navegación
- [ ] Navbar mobile funciona con menú hamburger (abrir/cerrar)
- [ ] Footer visible en todas las páginas públicas
- [ ] Todas las rutas públicas existen y renderizan sin error 404
- [ ] Todas las rutas admin existen y renderizan sin error 404 (sin auth todavía)
- [ ] Navegación entre páginas funciona sin errores
- [ ] `pnpm build` pasa — no hay errores de hidratación React
- [ ] El Navbar usa los tokens de color correctos de UI-001

---

## Edge cases

- `(public)` es un route group en Next.js App Router — los paréntesis no aparecen en la URL
- La página `admin/layout.tsx` aún no verifica sesión (eso es #010); por ahora es solo estructura
- El menú hamburger mobile requiere `"use client"` para el estado de open/close
- Asegurar que el Navbar se renderiza como Server Component (sin "use client") excepto la parte interactiva del mobile

---

## Tests requeridos

```typescript
// tests/unit/components/layout/navbar.test.tsx
import { render, screen } from "@testing-library/react"
import { Navbar } from "@/components/layout/navbar"

describe("Navbar", () => {
  it("renderiza los links de navegación", () => {
    render(<Navbar />)
    expect(screen.getByText("Galería")).toBeInTheDocument()
    expect(screen.getByText("Perfil")).toBeInTheDocument()
    expect(screen.getByText("Reservar")).toBeInTheDocument()
  })
})
```

---

## Definition of Done

- [ ] Navbar y Footer creados con diseño de UI-001
- [ ] Todas las rutas públicas y admin existen con páginas placeholder
- [ ] Navegación funciona entre todas las páginas
- [ ] `pnpm build && pnpm typecheck && pnpm lint` pasan
- [ ] Tests básicos de Navbar creados y pasando
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
