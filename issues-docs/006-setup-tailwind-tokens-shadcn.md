# ISSUE #006 — Setup TailwindCSS 4, tokens UI-001 y Shadcn/UI base

## Epic
EPIC 1 — System Foundation

## Type
Task

## Priority
P0

## Dependencies
- #002 — Next.js y estructura base

---

## Contexto

El sistema de diseño UI-001 define una paleta de colores, tipografía, espaciados y radios específicos para el estudio de tatuajes (tema oscuro, acento rojo #B91C1C). Sin configurar estos tokens desde el inicio, cada componente que se cree podría usar valores arbitrarios rompiendo la coherencia visual. Shadcn/UI debe configurarse sobre estos tokens, no sobre sus valores por defecto.

---

## Objetivo

Configurar TailwindCSS 4 con los tokens exactos del sistema UI-001 e instalar Shadcn/UI inicializado sobre esos tokens. El resultado es un sistema de componentes listo para usar con el tema oscuro del estudio.

---

## Scope

- Instalar TailwindCSS 4 y sus dependencias
- Configurar `tailwind.config.ts` con todos los tokens de UI-001:
  - Paleta de colores (backgrounds, surfaces, borders, accent rojo, texto, estados)
  - Tipografía: Inter Variable + escala de tamaños
  - Espaciados: sistema base 4px
  - Border radius definidos
- Configurar fuente Inter de Google Fonts en el layout
- Instalar y configurar Shadcn/UI con tema oscuro
- Actualizar `globals.css` con variables CSS de los tokens
- Crear un componente de prueba para verificar que los tokens funcionan

---

## Anti-scope

- No crear todos los componentes UI de la aplicación (eso es #028)
- No crear páginas de contenido
- No instalar iconos de Lucide (se instalan al crear los primeros componentes)
- No crear Storybook (fuera del MVP)

---

## Archivos afectados

```
tailwind.config.ts          ← CREAR/MODIFICAR
src/styles/globals.css      ← MODIFICAR (variables CSS + imports)
src/app/layout.tsx          ← MODIFICAR (añadir fuente Inter)
components.json             ← CREAR (config Shadcn/UI)
src/components/ui/          ← INICIALIZAR con Shadcn/UI
package.json                ← MODIFICAR (añadir dependencias)
```

---

## Flujo de ejecución

1. Crear rama `feature/006-tailwind-shadcn` desde `develop`
2. Instalar TailwindCSS 4: `pnpm add tailwindcss @tailwindcss/postcss` y `pnpm add -D @types/...`
3. Crear/actualizar `tailwind.config.ts` con tokens UI-001
4. Actualizar `src/styles/globals.css` con variables CSS y directivas de Tailwind
5. Añadir fuente Inter Variable en `src/app/layout.tsx` via `next/font/google`
6. Inicializar Shadcn/UI: `pnpm dlx shadcn@latest init` con tema oscuro
7. Instalar el primer componente de Shadcn como verificación: `pnpm dlx shadcn@latest add button`
8. Verificar visualmente que el tema oscuro y los colores son correctos
9. Ejecutar `pnpm build && pnpm typecheck && pnpm lint`
10. Crear PR a `develop`

---

## Tokens exactos de UI-001

### Colores del sistema (en tailwind.config.ts)

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",  // Siempre dark en este proyecto
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: {
          DEFAULT: "#0A0A0A",
          secondary: "#111111",
        },
        // Surfaces
        surface: {
          DEFAULT: "#1A1A1A",
          hover: "#242424",
        },
        // Border
        border: {
          DEFAULT: "#2A2A2A",
        },
        // Accent (Rojo primario)
        accent: {
          DEFAULT: "#B91C1C",
          hover: "#991B1B",
          active: "#7F1D1D",
        },
        // Texto
        foreground: {
          DEFAULT: "#FAFAFA",
          secondary: "#A3A3A3",
          muted: "#737373",
          disabled: "#525252",
        },
        // Estados
        success: "#15803D",
        warning: "#D97706",
        error: "#DC2626",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.1", fontWeight: "700" }],    // 48px
        h1: ["2.25rem", { lineHeight: "1.2", fontWeight: "700" }],      // 36px
        h2: ["1.875rem", { lineHeight: "1.25", fontWeight: "600" }],    // 30px
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],       // 24px
        h4: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],      // 20px
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],                 // 18px
        body: ["1rem", { lineHeight: "1.6" }],                          // 16px
        sm: ["0.875rem", { lineHeight: "1.5" }],                        // 14px
        caption: ["0.75rem", { lineHeight: "1.4" }],                    // 12px
      },
      spacing: {
        // Sistema base 4px
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
        24: "96px",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
        xl: "24px",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
}

export default config
```

### Variables CSS en globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    /* Shadcn/UI variables mapeadas a nuestros tokens */
    --card: 0 0% 10%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 72% 42%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 10%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 64%;
    --accent: 0 72% 42%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 16%;
    --input: 0 0% 16%;
    --ring: 0 72% 42%;
    --radius: 0.75rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### Inter en layout.tsx

```typescript
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}
```

---

## Reglas del sistema aplicables

- UI-001: Paleta de colores exacta (no inventar colores)
- UI-001: Tipografía Inter Variable, pesos 400/500/600/700 únicamente
- UI-001: Sistema de espaciado base 4px
- UI-001: Tema oscuro únicamente (sin toggle light/dark en MVP)
- FRONT-001: TailwindCSS obligatorio, sin CSS arbitrario ni inline styles

---

## Criterios de aceptación

- [ ] `pnpm dev` muestra la app con fondo `#0A0A0A` (tema oscuro)
- [ ] Los tokens de color de UI-001 están disponibles como clases de Tailwind (ej. `bg-accent`, `text-foreground-secondary`)
- [ ] La fuente Inter carga correctamente (verificar en DevTools)
- [ ] Shadcn/UI está inicializado y el componente `Button` importa y renderiza correctamente
- [ ] `pnpm build` pasa sin errores de CSS
- [ ] No hay colores hardcodeados en el CSS que contradigan UI-001

---

## Edge cases

- TailwindCSS 4 tiene cambios en la API respecto a v3: revisar documentación de TailwindCSS 4 para sintaxis actualizada
- Shadcn/UI puede tener conflictos de variables con los tokens propios: ajustar el mapeo en `:root`
- Inter Variable puede no estar disponible en todos los browsers antiguos: el fallback `system-ui` cubre esto

---

## Tests requeridos

No aplica tests automatizados — la verificación es visual y de build. El CI valida que el build pasa correctamente.

---

## Definition of Done

- [ ] TailwindCSS 4 instalado y configurado con tokens UI-001
- [ ] Fuente Inter Variable funcionando
- [ ] Shadcn/UI inicializado con tema oscuro
- [ ] Componente Button de Shadcn renderiza con el tema correcto
- [ ] `pnpm build && pnpm typecheck && pnpm lint` pasan
- [ ] PR mergeado con CI verde
- [ ] Issue cerrada
