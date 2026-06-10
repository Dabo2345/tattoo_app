# ISSUE #028 — Componentes UI base: Button, Input, Card, Modal, Badge, Toast

---

# 1. CONTEXTO

La EPIC 5 (Client Platform) necesita componentes UI reutilizables antes de construir las páginas públicas. El `Button` ya existe desde #006 (Shadcn/UI). Esta issue añade los cinco restantes siguiendo el mismo patrón y los tokens de UI-001.

---

# 2. OBJETIVO

Crear los componentes base: `Input`, `Card`, `Modal`, `Badge` y `Toast` en `src/components/ui/`, siguiendo el Design System (UI-001) y el patrón Shadcn/UI ya establecido.

---

# 3. ALCANCE (SCOPE)

- `src/components/ui/input.tsx` — Input con label, error y helper text
- `src/components/ui/card.tsx` — Card, CardHeader, CardTitle, CardContent, CardFooter
- `src/components/ui/modal.tsx` — Modal con Portal, ESC, backdrop click, animación 200ms
- `src/components/ui/badge.tsx` — Badge con variantes de estado (success, warning, error, info)
- `src/components/ui/toast.tsx` — ToastProvider + useToast hook, auto-dismiss 5s
- `tests/unit/components/ui/` — tests unitarios para cada componente

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No crear CalendarPublic ni SlotPicker (issue #029)
- No instalar nuevas dependencias externas
- No modificar CSS global ni tokens
- No Storybook (fuera de MVP)

---

# 5. ARCHIVOS AFECTADOS

- `src/components/ui/input.tsx` (nuevo)
- `src/components/ui/card.tsx` (nuevo)
- `src/components/ui/modal.tsx` (nuevo)
- `src/components/ui/badge.tsx` (nuevo)
- `src/components/ui/toast.tsx` (nuevo)
- `tests/unit/components/ui/input.test.tsx` (nuevo)
- `tests/unit/components/ui/card.test.tsx` (nuevo)
- `tests/unit/components/ui/modal.test.tsx` (nuevo)
- `tests/unit/components/ui/badge.test.tsx` (nuevo)
- `tests/unit/components/ui/toast.test.tsx` (nuevo)

---

# 6. FLUJO DE EJECUCIÓN

1. Leer UI-001 §13-20, FRONT-001 §25 (ya leídos)
2. Implementar cada componente con Tailwind + CVA donde aplique
3. Modal: React.createPortal + gestión ESC y backdrop
4. Toast: Context + Provider + useToast hook
5. Escribir tests con @testing-library/react + happy-dom
6. Ejecutar suite completa

---

# 7. REGLAS DE NEGOCIO / DISEÑO

- UI-001 §3: Dark Theme único, sin selector light/dark
- UI-001 §13: Button → primary (accent), secondary (surface), ghost
- UI-001 §14: Inputs con label, placeholder, error, focus
- UI-001 §16: Cards con surface, border sutil, hover suave
- UI-001 §20: Modales cierran con botón/ESC/click exterior, animación máx 200ms
- UI-001 §25: WCAG AA — contraste, focus visible, navegación teclado
- FRONT-001 §6: Modal y Toast son "use client" (interacción UI)
- FRONT-001 §24: Solo TailwindCSS, sin CSS arbitrario

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] Input renderiza label, aplica clase error, acepta props nativas
- [ ] Card y subcomponentes renderizan correctamente
- [ ] Modal: abre/cierra con prop isOpen, cierra con ESC, cierra con backdrop, tiene aria-modal
- [ ] Badge: renderiza las variantes default, success, warning, error, info
- [ ] Toast: useToast añade y auto-elimina toasts, ToastProvider renderiza lista
- [ ] Tests pasan con `pnpm test`
- [ ] No se añaden dependencias nuevas

---

# 9. CASOS EDGE

- Input con error muestra mensaje de error y clase roja
- Modal no se monta en DOM cuando isOpen=false
- Badge sin variant usa default
- Toast auto-dismiss después de 5 segundos
- Modal cierra al hacer click en backdrop (no en el contenido)

---

# 10. TESTS REQUERIDOS

Unit tests con @testing-library/react + happy-dom:
- Input: renderiza label, muestra error, acepta className
- Card: renderiza título y contenido
- Modal: visible con isOpen=true, invisible con false, cierra con ESC
- Badge: renderiza variantes correctas
- Toast: useToast añade toast, ToastProvider renderiza toasts

---

# 11. DEPENDENCIAS

- #006 — TailwindCSS + tokens UI-001 + Shadcn/UI base ✅

---

# 12. DEFINICIÓN DE DONE

- [ ] 5 componentes creados
- [ ] Tests unitarios verdes
- [ ] `pnpm test` verde (suite completa)
- [ ] PR creado
