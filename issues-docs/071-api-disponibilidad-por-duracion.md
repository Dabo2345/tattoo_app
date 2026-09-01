# ISSUE DOC #071 — API: Disponibilidad filtrada por duración de sesión

**Issue GitHub:** #071  
**Tipo:** feature  
**Epic:** EPIC 3 — Booking Core (extensión)  
**Rama:** `feature/071-api-disponibilidad-por-duracion`  
**Estado:** PENDIENTE  
**Fecha:** 2026-06-18  

---

## 1. CONTEXTO

Actualmente `/api/availability` devuelve todos los slots disponibles de 30 minutos en un rango de fechas. Para el flujo de reserva de sesiones de tatuaje, el cliente necesita ver solo los slots donde haya suficientes horas consecutivas disponibles para completar la sesión (ej: una sesión de 5 horas solo puede empezar en un horario donde los siguientes 10 slots de 30 min también estén libres).

Sin este cambio, el calendario mostraría slots "disponibles" donde en realidad la sesión no cabría, causando overbooking o errores al confirmar la reserva.

---

## 2. OBJETIVO

Añadir un parámetro opcional `durationMinutes` a `/api/availability`. Cuando se proporciona, el endpoint devuelve únicamente los slots de inicio válidos: aquellos donde el rango completo de slots consecutivos necesarios para la duración indicada están todos disponibles.

Actualizar el componente `SessionBooking` para que use este parámetro al cargar disponibilidad para sesiones de tatuaje.

---

## 3. SCOPE

- Añadir parámetro `durationMinutes` (opcional, entero, múltiplo de 30, entre 30 y 600) al endpoint `GET /api/availability`
- Cuando `durationMinutes` está presente: filtrar y devolver solo slots de inicio donde los N slots consecutivos necesarios estén todos disponibles
- Cuando `durationMinutes` está ausente: comportamiento actual sin cambios
- Actualizar `CalendarService` (o donde reside la lógica de disponibilidad) para soportar el filtrado por duración
- Actualizar el componente `session-booking.tsx` para pasar `durationMinutes` al cargar disponibilidad

---

## 4. ANTI-SCOPE

- NO cambiar el formato de respuesta del endpoint (sigue devolviendo slots)
- NO modificar el algoritmo de disponibilidad para consultas (tipo `consultation`)
- NO cambiar la frecuencia de los slots (siguen siendo de 30 min)
- NO implementar el calendario del cliente para el plan de tatuaje (eso forma parte de #072 indirectamente — el componente `SessionBooking` existente ya maneja la UI)
- NO modificar el schema de Prisma

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/app/api/availability/route.ts` — añadir y validar parámetro `durationMinutes`
- `src/modules/calendar/services/calendar-service.ts` — añadir lógica de filtrado por slots consecutivos
- `src/modules/booking/components/session-booking.tsx` — pasar `durationMinutes` al fetch de disponibilidad

### Tests
- `tests/unit/calendar-service.test.ts` — añadir tests de filtrado por duración
- `tests/integration/availability.test.ts` — añadir tests con `durationMinutes`

### Docs
- `docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md`

---

## 6. FLUJO DE EJECUCIÓN

1. Leer `src/app/api/availability/route.ts` completo
2. Leer `src/modules/calendar/services/calendar-service.ts` completo para entender cómo se calculan los slots disponibles
3. Leer `src/modules/booking/components/session-booking.tsx` para entender cómo se consume la disponibilidad
4. En `CalendarService`, añadir método o parámetro `getAvailableSlots({ from, to, type, durationMinutes? })`:

   **Algoritmo de filtrado por duración:**
   ```
   slotsRequired = durationMinutes / 30  // ej: 300min / 30 = 10 slots

   availableStartSlots = []
   for each slot S in allSlots (ordenados por startTime):
     // Verificar que S y los siguientes (slotsRequired - 1) slots son todos libres
     consecutiveSlots = slots[S ... S + slotsRequired - 1]
     if consecutiveSlots.length == slotsRequired && all(slot.available):
       availableStartSlots.append(S)

   return availableStartSlots
   ```

   Consideraciones del algoritmo:
   - Los slots consecutivos deben ser contiguos en el tiempo (sin huecos)
   - Respetar el horario de cierre del estudio (no permitir inicio si la sesión terminaría después del cierre)
   - Un slot marcado como bloqueado (BlockedPeriod) rompe la cadena de consecutivos

5. En `route.ts`:
   - Parsear `durationMinutes` de query params: `const durationMinutes = searchParams.get('durationMinutes')`
   - Validar con Zod: número entero, múltiplo de 30, entre 30 y 600 (si está presente)
   - Pasar a `CalendarService`

6. En `session-booking.tsx`:
   - Localizar el fetch a `/api/availability`
   - Añadir `&durationMinutes=${durationMinutes}` al URL cuando `durationMinutes` está disponible desde el `SessionLink`
   - Verificar que `SessionLink` ya tiene `sessionDurationMinutes` disponible en el componente (debería venir del GET al validar el token)

7. Escribir tests
8. Actualizar docs

---

## 7. REGLAS DE NEGOCIO

- **RB-AV-001:** Un slot de inicio es válido para una sesión de N horas solo si todos los slots consecutivos necesarios (N×2 slots de 30min) están disponibles Y la sesión termina dentro del horario del estudio.
- **RB-AV-002:** Si `durationMinutes` no es múltiplo de 30, la API devuelve 400 Bad Request.
- **RB-AV-003:** Si `durationMinutes` está ausente, el comportamiento es idéntico al actual (sin cambios).
- **RB-AV-004:** Un `BlockedPeriod` que cae dentro del rango de una sesión invalida ese slot de inicio.
- **RB-AV-005:** El slot de inicio más tardío posible es `horasCierre - durationMinutes`. Ejemplo: estudio cierra a las 20:00 y la sesión es de 5h → el último slot de inicio válido es las 15:00.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] `GET /api/availability?from=X&to=Y&durationMinutes=300` devuelve solo slots donde 5h consecutivas están disponibles
- [ ] `GET /api/availability?from=X&to=Y` (sin `durationMinutes`) funciona igual que antes
- [ ] `GET /api/availability?durationMinutes=123` (no múltiplo de 30) → 400 Bad Request
- [ ] `GET /api/availability?durationMinutes=0` → 400 Bad Request
- [ ] `GET /api/availability?durationMinutes=601` → 400 Bad Request
- [ ] El componente `SessionBooking` pasa `durationMinutes` al cargar disponibilidad cuando el SessionLink tiene duración
- [ ] No se rompe ningún test existente de disponibilidad
- [ ] CI verde

---

## 9. EDGE CASES

- **Sesión que cruza mediodía:** Si el estudio tiene pausa de comida configurada en los horarios, esa pausa corta los slots consecutivos. Un slot de 5h que incluye la hora de pausa no debe ser válido como inicio.
- **Último slot del día:** Si el último slot disponible es a las 19:30 y la sesión requiere 2h, el 19:30 no es válido (terminaría a las 21:30, fuera del horario). El algoritmo debe descartar estos casos.
- **Sin slots disponibles:** Si no hay ningún slot válido para la duración requerida en el rango dado, devolver array vacío (no error).
- **`durationMinutes = 30`:** Equivalente al comportamiento actual (1 slot). Debe devolver los mismos resultados que sin el parámetro.
- **Día completo bloqueado:** Si el estudio tiene un `BlockedPeriod` que cubre todo el día, no debe haber slots disponibles para ninguna duración.

---

## 10. TESTS REQUERIDOS

### Unitarios (`calendar-service.test.ts`)
- Día con 8h disponibles, pedir slots para 5h → devuelve solo los slots de inicio donde caben las 5h
- Día con fragmentos discontinuos (ej: 3h libres, 1h bloqueada, 4h libres), pedir 5h → 0 slots válidos para 5h
- Pedir `durationMinutes=30` → resultado equivalente a sin parámetro
- Sesión que excede hora de cierre del estudio → slot excluido
- Dia con `BlockedPeriod` en medio → rompe cadena de consecutivos

### Integración (`availability.test.ts`)
- `GET /api/availability` con `durationMinutes=120` → 200 + solo slots con 2h consecutivas
- `GET /api/availability` con `durationMinutes=999` → 400
- `GET /api/availability` sin `durationMinutes` → 200 + comportamiento existente (no regresión)

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `API-001` | `GET /api/availability` | Añadir parámetro `durationMinutes` con descripción, validación y ejemplos |

---

## 12. DEPENDENCIAS

- **#069** mergeada (no directa, pero forma parte de la misma fase)
- No depende de #070 ni #072. Puede desarrollarse en paralelo con ellas.

---

## 13. DEFINITION OF DONE

- [ ] Parámetro `durationMinutes` implementado en API y servicio
- [ ] Algoritmo de slots consecutivos implementado y probado
- [ ] `SessionBooking` actualizado para pasar `durationMinutes`
- [ ] Tests unitarios y de integración pasan
- [ ] No hay regresiones en tests existentes de disponibilidad
- [ ] CI completamente verde
- [ ] `API-001` actualizado
- [ ] PR creado con descripción completa
