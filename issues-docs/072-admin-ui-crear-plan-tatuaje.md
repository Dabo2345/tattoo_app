# ISSUE DOC #072 — Admin UI: Crear y enviar plan de tatuaje

**Issue GitHub:** #072  
**Tipo:** feature  
**Epic:** EPIC 6 — Admin  
**Rama:** `feature/072-admin-ui-crear-plan-tatuaje`  
**Estado:** PENDIENTE  
**Fecha:** 2026-06-18  

---

## 1. CONTEXTO

Con el backend listo (#070) y la disponibilidad por duración operativa (#071), el administrador necesita una interfaz en el panel de admin para crear el plan de tatuaje tras una consulta confirmada. El flujo debe ser intuitivo: desde la vista de una cita de tipo CONSULTATION en estado CONFIRMED, el tatuador puede definir las características del tatuaje, añadir las sesiones necesarias con sus duraciones, guardar en borrador y finalmente enviar al cliente.

---

## 2. OBJETIVO

Añadir en el panel de admin, en la vista de detalle de una cita de consulta confirmada, un flujo para:

1. Crear un plan de tatuaje (formulario con características + sesiones)
2. Ver el plan creado y el estado de cada sesión
3. Enviar el plan al cliente (un click que genera los SessionLinks y manda el email)

---

## 3. SCOPE

- Identificar dónde se muestran las citas en el admin (dashboard / detalle de appointment) y añadir el punto de entrada
- Nuevo componente `TattooPlanForm` para crear el plan
- Vista de estado del plan: muestra características + sesiones con su estado (PENDING / LINK_SENT / BOOKED / COMPLETED)
- Botón "Enviar al cliente" que llama a `POST /api/admin/tattoo-plans/:planId/send`
- Estados de carga, error y éxito en todos los formularios
- Solo visible para appointments de tipo `CONSULTATION` en estado `CONFIRMED` que NO tengan ya un plan

---

## 4. ANTI-SCOPE

- NO modificar el backend (ya hecho en #070)
- NO implementar la vista del cliente (usa el flujo existente de `/session-link/[token]` que ya existe)
- NO modificar el calendario de disponibilidad del admin
- NO añadir edición del plan una vez enviado (el plan SENT es de solo lectura)
- NO añadir paginación ni filtros al listado de citas
- NO escribir lógica de negocio en componentes UI

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/app/admin/` — localizar la vista de citas/agenda para añadir punto de entrada al plan
- `src/modules/booking/components/tattoo-plan-form.tsx` — nuevo componente (formulario de creación)
- `src/modules/booking/components/tattoo-plan-status.tsx` — nuevo componente (vista de estado del plan)
- `src/modules/booking/types/tattoo-plan.ts` — añadir tipos de UI si necesario (ya existe de #070)

### Tests
- `tests/unit/tattoo-plan-form.test.tsx` — nuevo

### Docs
- `docs/Documento 07 — UX-001 — Flujos de Usuario y Experiencia de Uso.md`
- `docs/Documento 08 — UI-001 — Sistema de Diseño.md` (si se añaden nuevos patrones de UI)

---

## 6. FLUJO DE EJECUCIÓN

1. Leer la estructura de `src/app/admin/` para identificar dónde se listan/detallan las citas
2. Leer el componente de agenda semanal y el panel de detalle de appointment (si existe)
3. En la vista de detalle de un appointment `CONSULTATION` + `CONFIRMED`:
   - Si no hay plan: mostrar botón **"Crear plan de tatuaje"**
   - Si hay plan en DRAFT: mostrar el plan con botón **"Enviar al cliente"** y botón **"Editar"** (futuro, por ahora solo lectura también en DRAFT)
   - Si el plan está en SENT o posterior: mostrar vista de estado (solo lectura)

4. **Componente `TattooPlanForm`:**
   Campos:
   - **Estilo** (Select): Blackwork, Japanese, Watercolor, Traditional, Neo-Traditional, Realism, Geometric, Fineline, Otro
   - **Tamaño** (Select): Pequeño (<5 cm), Mediano (5–15 cm), Grande (15–30 cm), Extra grande (>30 cm)
   - **Placement** (Input de texto): ej. "Antebrazo izquierdo"
   - **Descripción** (Textarea, min 20 chars): descripción detallada del diseño acordado
   - **Notas del artista** (Textarea, opcional): instrucciones especiales para el cliente
   - **Sesiones** (sección dinámica):
     - Botón "Añadir sesión"
     - Cada sesión: etiqueta "Sesión N" + selector de duración (1h, 1.5h, 2h, 2.5h, 3h, 3.5h, 4h, 4.5h, 5h, 6h, 7h, 8h, 9h, 10h)
     - Mínimo 1 sesión, máximo 10
     - Botón de eliminar sesión (si hay más de 1)
   - Botón **"Guardar plan"** → `POST /api/admin/appointments/:id/tattoo-plan`

5. **Componente `TattooPlanStatus`:**
   - Muestra las características del tatuaje (estilo, tamaño, placement, descripción, notas)
   - Lista de sesiones con: número de sesión, duración, estado (badge de color), y link a la URL del SessionLink si ya fue generado
   - Si status = DRAFT: botón **"Enviar al cliente"** → `POST /api/admin/tattoo-plans/:planId/send` → actualiza la UI con status SENT
   - Si status = SENT/IN_PROGRESS/COMPLETED: mostrar estado visual sin botón de envío

6. Manejo de estados de carga:
   - Al guardar: deshabilitar botón + mostrar spinner
   - Al enviar: deshabilitar botón + mostrar spinner + toast de éxito/error
   - Error: mostrar mensaje descriptivo sin crash

7. Escribir tests del componente `TattooPlanForm`
8. Actualizar docs

---

## 7. REGLAS DE NEGOCIO

- **UI-TP-001:** El formulario de plan solo aparece en citas tipo `CONSULTATION` en estado `CONFIRMED`.
- **UI-TP-002:** Si ya existe un plan para la cita, no se muestra el botón "Crear plan" sino la vista de estado.
- **UI-TP-003:** El selector de duración de sesión solo permite valores múltiplos de 30 min (en horas enteras o medias horas).
- **UI-TP-004:** Al enviar el plan, la UI debe actualizarse inmediatamente para reflejar el estado SENT sin necesidad de recargar la página.
- **UI-TP-005:** Un plan enviado (SENT) no puede editarse desde la UI. Mostrar los datos en modo lectura.
- **UI-TP-006:** Toda lógica de validación de negocio permanece en el backend. La UI solo valida presencia de campos requeridos y formato básico.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] En una cita CONSULTATION + CONFIRMED sin plan: aparece el botón "Crear plan de tatuaje"
- [ ] Al hacer click, se muestra el formulario con todos los campos requeridos
- [ ] Se puede añadir y eliminar sesiones dinámicamente (mínimo 1, máximo 10)
- [ ] Al guardar, se llama a `POST /api/admin/appointments/:id/tattoo-plan` y se muestra la vista de estado
- [ ] La vista de estado muestra características del tatuaje + sesiones con sus estados
- [ ] El botón "Enviar al cliente" llama a `POST /api/admin/tattoo-plans/:planId/send`
- [ ] Tras enviar, la UI muestra el plan como SENT (sin botón de envío)
- [ ] Errores de API se muestran como mensajes de error, no como crashes
- [ ] El formulario usa componentes de Shadcn/UI existentes (Button, Input, Select, Textarea, Badge)
- [ ] CI verde

---

## 9. EDGE CASES

- **Sin internet / API caída:** Mostrar mensaje de error, no spinner infinito. El botón debe volver a habilitarse.
- **Doble click en "Enviar al cliente":** Deshabilitar el botón durante la petición para evitar doble envío.
- **Plan ya enviado (recarga de página):** La UI debe detectar `plan.status === 'SENT'` al cargar y mostrar vista de solo lectura directamente.
- **Appointment sin cliente con email:** El backend rechazará el envío si no hay email para el cliente. La UI debe mostrar el error del backend de forma legible.
- **Sesión con duración 0 o inválida:** La validación del formulario debe prevenir el submit. El selector de duración no debe permitir valores inválidos.

---

## 10. TESTS REQUERIDOS

### Unitarios (`tattoo-plan-form.test.tsx`)
- Renderiza correctamente con todos los campos
- "Añadir sesión" añade una nueva sesión al formulario
- "Eliminar sesión" la elimina (y no permite eliminar la última)
- Submit con campos vacíos → muestra errores de validación
- Submit con datos válidos → llama a la API con los datos correctos
- Estado de carga durante submit (botón deshabilitado)
- Estado de error → muestra mensaje de error

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `UX-001` | Flujo admin — gestión de citas | Añadir flujo: crear plan de tatuaje → enviar al cliente |
| `UI-001` | Componentes de formulario | Documentar `TattooPlanForm` y `TattooPlanStatus` como nuevos componentes |

---

## 12. DEPENDENCIAS

- **#070 debe estar MERGEADA** — los endpoints de API deben existir
- **#071 debe estar MERGEADA** — para que la vista de cliente funcione correctamente con la duración (aunque no afecta directamente a la UI admin)

---

## 13. DEFINITION OF DONE

- [ ] Componentes `TattooPlanForm` y `TattooPlanStatus` implementados
- [ ] Integrados en la vista de admin de citas
- [ ] Tests del formulario pasan
- [ ] CI completamente verde
- [ ] `UX-001` actualizado con el nuevo flujo
- [ ] `UI-001` actualizado con los nuevos componentes
- [ ] PR creado con descripción completa
- [ ] Probado manualmente: flujo completo desde admin (crear plan → enviar) funciona en local
