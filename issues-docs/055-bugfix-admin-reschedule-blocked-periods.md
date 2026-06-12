# ISSUE DOC #055 — Bugfix crítico: admin reschedule ignora BlockedPeriods

## CONTEXTO

La ruta `POST /api/admin/appointments/:id/reschedule` verifica conflictos de citas con una query manual a Prisma que solo consulta la tabla `Appointment`. No consulta `BlockedPeriod`.

El admin puede reprogramar citas en días/horarios marcados como bloqueados (vacaciones, festivos, mantenimiento), generando inconsistencias en el calendario.

**Root cause**: El admin reschedule usa una query de conflicto manual en lugar de delegar en `calendarService.assertSlotAvailable()`, que ya verifica tanto appointments como blocked periods.

Comparación:
- **Ruta cliente** (`/api/appointments/:id/reschedule`): llama `await calendarService.assertSlotAvailable(newStartAt, newEndsAt)` ✅
- **Ruta admin** (`/api/admin/appointments/:id/reschedule`): query manual solo sobre appointments ❌

## OBJETIVO

Reemplazar la query manual de conflictos en la ruta admin por una llamada a `calendarService.assertSlotAvailable()`, igual que la ruta cliente.

## SCOPE

- `src/app/api/admin/appointments/[id]/reschedule/route.ts` — reemplazar query manual por calendarService
- Tests de integración del admin reschedule

## ANTI-SCOPE

- No modificar `calendarService`
- No cambiar el comportamiento de la ruta cliente (ya funciona)

## ARCHIVOS AFECTADOS

```
src/app/api/admin/appointments/[id]/reschedule/route.ts   ← MODIFIED
tests/integration/api/admin-reschedule.test.ts             ← NEW or UPDATE
issues-docs/055-bugfix-admin-reschedule-blocked-periods.md ← NEW
```

## FLUJO DE EJECUCIÓN

1. Leer el archivo actual
2. Importar `calendarService` de `@/modules/calendar/services/calendar-service`
3. Importar `SlotNotAvailableError` de `@/lib/api/errors`
4. Eliminar el bloque `const conflict = await prisma.appointment.findFirst(...)` (líneas 50-57)
5. Reemplazar por `await calendarService.assertSlotAvailable(newStartDate, newEndsAt)`
   - Este método lanza `SlotNotAvailableError` si el slot no está disponible
6. Manejar `SlotNotAvailableError` → respuesta 409 con código `SLOT_NOT_AVAILABLE`
7. Como ya no se usa el `conflict` check manual, verificar si `prisma` sigue siendo necesario o si se puede eliminar el import directo

## CÓDIGO ACTUAL (a reemplazar)

```typescript
const conflict = await prisma.appointment.findFirst({
  where: {
    id: { not: id },
    deletedAt: null,
    status: { notIn: ["CANCELLED"] },
    AND: [{ startsAt: { lt: newEndsAt } }, { endsAt: { gt: newStartDate } }],
  },
})

if (conflict) {
  return Response.json(
    { success: false, error: { code: "SLOT_NOT_AVAILABLE", message: "..." } },
    { status: 409 }
  )
}
```

## CÓDIGO CORRECTO

```typescript
// Lanza SlotNotAvailableError si hay conflicto de cita O BlockedPeriod
await calendarService.assertSlotAvailable(newStartDate, newEndsAt)
```

El `withErrorHandler` (o el try/catch existente) debe capturar `SlotNotAvailableError` y devolver 409.

## CRITERIOS DE ACEPTACIÓN

- [ ] Admin intenta reprogramar en horario de otra cita → 409 SLOT_NOT_AVAILABLE
- [ ] Admin intenta reprogramar en período bloqueado → 409 SLOT_NOT_AVAILABLE
- [ ] Admin reprograma en horario libre sin blocked periods → 200, cita actualizada
- [ ] Tests de integración verifican el comportamiento con BlockedPeriod

## TESTS REQUERIDOS

```
tests/integration/api/admin-reschedule.test.ts
```

- Happy path: reschedule en slot libre → 200
- Conflicto con otra cita → 409
- **Conflicto con BlockedPeriod → 409** (el caso nuevo que no se cubría)
- Appointment no encontrado → 404
- Admin no autenticado → 401

## DOCUMENTACIÓN AFECTADA

- `docs/Documento 05 — API-001 ...` → Sección admin reschedule: añadir que verifica BlockedPeriods además de citas

## DEPENDENCIAS

- Ninguna

## DEFINITION OF DONE

- [ ] `calendarService.assertSlotAvailable()` llamado en admin reschedule
- [ ] Tests de integración incluyendo caso BlockedPeriod
- [ ] `pnpm test --run` verde
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
