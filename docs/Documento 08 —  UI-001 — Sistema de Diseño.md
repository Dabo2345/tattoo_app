# UI-001 — Sistema de Diseño

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-05

---

# 1. Objetivo

Definir la identidad visual oficial del sistema.

Toda interfaz desarrollada deberá seguir las reglas descritas en este documento.

No se permitirá introducir estilos arbitrarios fuera del Design System.

---

# 2. Filosofía Visual

Concepto:

Dark Modern Tattoo Studio

---

Valores visuales:

* Profesional
* Moderna
* Urbana
* Premium
* Minimalista
* Centrada en las fotografías

---

La galería de tatuajes es el elemento visual principal del producto.

La interfaz nunca deberá competir visualmente con las fotografías.

---

# 3. Tema Oficial

Modo único:

Dark Theme

---

No existirá selector Light/Dark en el MVP.

---

# 4. Paleta de Colores

## Background

Background Primary

#0A0A0A

---

Background Secondary

#111111

---

Surface

#1A1A1A

---

Surface Hover

#242424

---

Border

#2A2A2A

---

# 5. Color de Marca

Primary Accent

#B91C1C

---

Primary Accent Hover

#991B1B

---

Primary Accent Active

#7F1D1D

---

Uso permitido:

Botones principales

Links destacados

Estados activos

Indicadores de selección

---

No utilizar como color de fondo principal.

---

# 6. Colores de Texto

Primary Text

#FAFAFA

---

Secondary Text

#A3A3A3

---

Muted Text

#737373

---

Disabled Text

#525252

---

# 7. Estados

Success

#15803D

---

Warning

#D97706

---

Error

#DC2626

---

Info

#2563EB

---

# 8. Tipografía

Familia principal

Inter

---

Google Font

Inter Variable

---

Pesos permitidos

400

500

600

700

---

No utilizar:

100

200

800

900

---

# 9. Escala Tipográfica

Display

48px

---

H1

36px

---

H2

30px

---

H3

24px

---

H4

20px

---

Body Large

18px

---

Body

16px

---

Small

14px

---

Caption

12px

---

# 10. Sistema de Espaciado

Base

4px

---

Escala

4

8

12

16

24

32

48

64

96

---

No utilizar medidas arbitrarias.

---

# 11. Bordes

Border Radius

---

Small

8px

---

Medium

12px

---

Large

16px

---

Extra Large

24px

---

# 12. Sombras

Uso mínimo.

---

Solo permitido:

Modales

Dropdowns

Lightbox

Calendario

---

Nunca usar sombras agresivas.

---

# 13. Botones

## Primary

Fondo Accent

Texto blanco

---

## Secondary

Surface

Border

Texto Primary

---

## Ghost

Transparente

---

Estados obligatorios

Default

Hover

Focus

Disabled

Loading

---

# 14. Inputs

Campos:

Nombre

Email

Teléfono

Descripción

---

Todos los inputs deberán incluir:

Label

Placeholder

Estado error

Estado focus

Ayuda contextual opcional

---

# 15. Formularios

Validación inline.

---

Errores debajo del campo.

---

No utilizar alerts globales para errores de formulario.

---

# 16. Cards

Uso:

Galería

Perfil

Citas

Configuraciones

---

Estilo:

Surface

Border sutil

Hover suave

---

# 17. Galería

Layout:

Masonry Grid

---

Responsive

2 columnas móvil

3 tablet

4 desktop

---

Al hacer click:

Lightbox fullscreen

---

# 18. Calendario Público

Vista:

Calendario mensual

---

Slots:

30 minutos

---

Estados

Disponible

Seleccionado

No disponible

Bloqueado

---

# 19. Calendario Admin

Inspiración:

Google Calendar

---

Vista semanal

---

Permitir:

Click

Drag

Resize futuro

---

# 20. Modales

Cerrar mediante:

Botón

ESC

Click exterior

---

Animación máxima:

200ms

---

# 21. Navegación Pública

Desktop

Navbar superior fija

---

Mobile

Menú hamburguesa

---

# 22. Footer

Contenido:

Dirección

Email

Teléfono

Instagram

Copyright

---

# 23. Animaciones

Duración estándar

150ms

---

Máximo permitido

300ms

---

Evitar animaciones innecesarias.

---

# 24. Responsive

Mobile First

---

Breakpoints

sm 640

md 768

lg 1024

xl 1280

2xl 1536

---

# 25. Accesibilidad

WCAG AA

---

Contraste suficiente

---

Focus visible obligatorio

---

Navegación teclado completa

---

Labels accesibles

---

# 26. Componentes Base

Button

Input

Textarea

Select

Checkbox

Modal

Card

Badge

Calendar

Lightbox

Tabs

Dropdown

Toast

---

Todos deberán estar documentados en Storybook.

---

# 27. Iconografía

Librería oficial

Lucide React

---

No mezclar librerías de iconos.

---

# 28. Imágenes

Formato preferido

WebP

---

Lazy Loading obligatorio

---

Responsive Images obligatorias

---

# 29. Consistencia

Ningún componente podrá crear estilos propios.

Todo deberá utilizar tokens definidos en este documento.

---

# 30. Principio Rector

Las fotografías del portfolio son las protagonistas.

La interfaz existe para mostrarlas, no para competir con ellas.
