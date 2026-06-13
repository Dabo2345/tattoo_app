# ISSUE DOC #066 — Fix: CalendarService lee horarios y descansos de StudioConfig (BD)

## 1. CONTEXTO

La issue #045 creó el modelo `StudioConfig` en BD y la UI de admin para configurar
horarios laborales, descansos y depósito. Sin embargo, el `CalendarService` (#013)
todavía usa constantes hardcodeadas:

```ts
const WORKING_START_HOUR = 10
const WORKING_END_HOUR = 20
const SLOT_DURATION_MINUTES = 30
const CONSULTATION_DURATION_MINUTES = 60
```

Y los `breaks` configurados en Settings nunca se aplican al generar slots disponibles.

Consecuencias:
- Cambiar horario en Settings → no afecta a los slots disponibles en `/reservar`
- Añadir descanso en Settings → no bloquea esas horas en el calendario de reservas

## 2. OBJETIVO

Hacer que `CalendarService` lea la configuración desde `StudioConfig` en BD,
de modo que los cambios en el admin Settings se reflejen inmediatamente en la
disponibilidad de slots para el cliente.

## 3. SCOPE

| Archivo | Acción |
|---------|--------|
| `src/modules/calendar/services/calendar-service.ts` | Modificar — leer config de BD |
| `src/modules/calendar/repositories/calendar-repository.ts` | Modificar — añadir `getStudioConfig()` |
| `tests/unit/calendar/calendar-service.test.ts` | Modificar — actualizar tests con config dinámica |

## 4. ANTI-SCOPE

- No modificar el schema de Prisma (`StudioConfig` ya existe)
- No modificar la UI de admin Settings (ya funciona)
- No cambiar el contrato de la API `GET /api/availability`
- No añadir soporte para horarios distintos por día de la semana (MVP: mismo horario todos los días)

## 5. FLUJO DE EJECUCIÓN

1. Añadir `getStudioConfig()` en `calendar-repository.ts`:
   ```ts
   getStudioConfig(): prisma.studioConfig.findUnique({ where: { id: STUDIO_CONFIG_ID } })
   ```
2. Modificar `CalendarService.getAvailableSlots()`:
   - Al inicio, cargar `StudioConfig` de BD
   - Usar `config.workingStartHour`, `config.workingEndHour`, `config.slotDurationMinutes`,
     `config.consultationDurationMinutes` en lugar de las constantes
   - Si no existe `StudioConfig` → usar los valores por defecto actuales como fallback
3. Aplicar `breaks` como periodos bloqueados:
   - Los breaks de `StudioConfig` (array JSON) deben tratarse igual que `BlockedPeriods`
   - Convertir cada break a un `OccupiedPeriod` para cada día del rango consultado
   - Pasarlos al filtro `isOccupied()` junto con los ocupados reales
4. Actualizar `isWithinWorkingHours()` para recibir las horas como parámetros
   en lugar de usar las constantes del módulo

## 6. REGLAS DE NEGOCIO (DATA-002)

- RB-009: Horario por defecto 10:00–20:00, slots de 30min, consulta de 60min
- RB-010: Las pausas configuradas bloquean automáticamente esos slots
- RB-011: BlockedPeriods tienen prioridad absoluta (ya implementado)
- `STUDIO_CONFIG_ID = "00000000-0000-0000-0000-000000000003"`

## 7. CRITERIOS DE ACEPTACIÓN

- [ ] Cambiar `workingStartHour` a 12 en Settings → `/reservar` no muestra slots antes de las 12
- [ ] Cambiar `workingEndHour` a 18 en Settings → `/reservar` no muestra slots después de las 18
- [ ] Añadir un descanso de 14:00 a 15:00 → esa hora no aparece disponible en el calendario
- [ ] Sin registro en BD → el servicio usa los valores por defecto (10–20, 30min, 60min)
- [ ] Los tests unitarios de CalendarService siguen pasando con config inyectada

## 8. EDGE CASES

- `StudioConfig` no existe en BD → usar defaults, no lanzar error
- Break que coincide con un appointment existente → el slot ya estaba ocupado, no hay conflicto
- Cambio de horario que deja citas existentes fuera de rango → no afecta citas ya confirmadas

## 9. TESTS REQUERIDOS

- Unit: `generateDaySlots` respeta `workingStartHour` y `workingEndHour` dinámicos
- Unit: slots dentro de un break no aparecen disponibles
- Unit: fallback a defaults cuando `StudioConfig` es null

## 10. DEPENDENCIAS

- #045 (completada) — `StudioConfig` ya existe en BD con datos
- #013 (completada) — CalendarService base ya funciona

## 11. DEFINITION OF DONE

- [ ] CalendarService lee config de BD
- [ ] Breaks bloquean slots correctamente
- [ ] Tests actualizados y pasando
- [ ] CI verde
- [ ] PR creado
