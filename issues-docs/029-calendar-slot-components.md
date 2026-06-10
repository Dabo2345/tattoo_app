# ISSUE #029 — Componentes de booking: CalendarPublic y SlotPicker

---

# 1. CONTEXTO

El flujo de reserva (issue #034) necesita dos componentes interactivos: un calendario mensual para seleccionar fecha y un selector de slots de 30min para elegir hora. Esta issue los construye como componentes reutilizables de la capa de módulos, usando TanStack Query (aprobado en STD-001) para fetchear la disponibilidad.

---

# 2. OBJETIVO

Crear:
1. `CalendarPublic` — calendario mensual que recibe `availableDates` y permite seleccionar un día
2. `SlotPicker` — lista de slots de 30min para una fecha, fetcha desde `GET /api/availability` con TanStack Query
3. `bookingApi.getAvailability(from, to)` — API layer del módulo booking
4. `QueryProvider` — wrapper de TanStack Query para el layout público

---

# 3. ALCANCE (SCOPE)

- `src/modules/booking/components/calendar-public.tsx` (nuevo)
- `src/modules/booking/components/slot-picker.tsx` (nuevo)
- `src/modules/booking/api/booking-api.ts` (nuevo)
- `src/components/providers/query-provider.tsx` (nuevo)
- Instalar `@tanstack/react-query` (aprobado STD-001)
- `tests/unit/modules/booking/calendar-public.test.tsx` (nuevo)
- `tests/unit/modules/booking/slot-picker.test.tsx` (nuevo)

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No construir la página /reservar completa (issue #034)
- No Calendario admin (issues #038-#039)
- No crear formulario de datos del cliente (issue #034)
- No integrar Stripe (issue #034)

---

# 5. ARCHIVOS AFECTADOS

- `package.json` — +`@tanstack/react-query`
- `src/modules/booking/api/booking-api.ts` (nuevo)
- `src/modules/booking/components/calendar-public.tsx` (nuevo)
- `src/modules/booking/components/slot-picker.tsx` (nuevo)
- `src/components/providers/query-provider.tsx` (nuevo)
- `tests/unit/modules/booking/calendar-public.test.tsx` (nuevo)
- `tests/unit/modules/booking/slot-picker.test.tsx` (nuevo)

---

# 6. FLUJO DE EJECUCIÓN

**CalendarPublic:**
- Props: `availableDates: string[]`, `selectedDate?: Date`, `onDateSelect: (date: Date) => void`
- Renderiza grid mensual (7 columnas × ~6 filas)
- Navega entre meses con botones prev/next
- Días con slots disponibles: clickeables y destacados
- Días sin slots: deshabilitados
- Día seleccionado: estado activo (accent color)

**SlotPicker:**
- Props: `date: Date`, `selectedSlot?: string`, `onSlotSelect: (startsAt: string) => void`
- Usa `useQuery(['availability', date]`, `bookingApi.getAvailability(from, to)`)
- Muestra loading skeleton mientras carga
- Muestra slots disponibles en grid de botones
- Slot seleccionado: estado activo

---

# 7. REGLAS DE NEGOCIO / DISEÑO

- UI-001 §18: calendario mensual, slots 30min, estados (disponible/seleccionado/no disponible)
- RB-008: solo mostrar slots de los próximos 60 días
- FRONT-001 §12: query key `['availability', dateRange]`
- FRONT-001 §6: "use client" obligatorio (estado interactivo)
- FRONT-001 §14: loading/success/error states siempre presentes

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] CalendarPublic renderiza grid de 7 columnas
- [ ] CalendarPublic marca como disponibles los días con slots
- [ ] CalendarPublic llama onDateSelect al hacer click en día disponible
- [ ] CalendarPublic navega entre meses
- [ ] SlotPicker muestra loading mientras fetcha
- [ ] SlotPicker renderiza botones de slots disponibles
- [ ] SlotPicker llama onSlotSelect al seleccionar slot
- [ ] Tests pasan con `pnpm test`

---

# 9. CASOS EDGE

- Mes sin slots disponibles → todos los días deshabilitados
- Día sin slots al seleccionar → SlotPicker muestra "No hay slots disponibles"
- Error de API → SlotPicker muestra mensaje de error
- Slot ya seleccionado → muestra estado activo

---

# 10. TESTS REQUERIDOS

Unit tests con @testing-library/react + happy-dom:

CalendarPublic:
- Renderiza 7 cabeceras de días de la semana
- Marca días disponibles como interactivos
- Llama onDateSelect al hacer click en día disponible
- No llama onDateSelect al hacer click en día sin slots

SlotPicker:
- Muestra skeleton de loading mientras carga
- Renderiza slots cuando la query resuelve
- Llama onSlotSelect al hacer click en slot
- Muestra mensaje cuando no hay slots

---

# 11. DEPENDENCIAS

- #028 — UI base components ✅
- #014 — GET /api/availability ✅

---

# 12. DEFINICIÓN DE DONE

- [ ] `@tanstack/react-query` instalado
- [ ] `bookingApi.getAvailability` creado
- [ ] `CalendarPublic` creado con tests
- [ ] `SlotPicker` creado con tests
- [ ] `QueryProvider` creado
- [ ] `pnpm test` verde
- [ ] PR creado
