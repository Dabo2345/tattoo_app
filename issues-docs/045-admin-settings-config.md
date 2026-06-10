# ISSUE DOC — #045 Admin: configuración (horarios laborales, pausas, depósito)

## 1. CONTEXTO

El CalendarService (#013) tiene los horarios laborales y la duración de consulta hardcodeados como constantes (WORKING_START_HOUR=10, WORKING_END_HOUR=20, CONSULTATION_DURATION_MINUTES=60). El depósito también está hardcodeado en el seed. Esta issue crea el modelo `StudioConfig` en Prisma (singleton) y la UI de admin para que el artista pueda configurar estos valores sin tocar código. RB-009 define los valores por defecto. RB-010 establece que las pausas configuradas bloquean automáticamente slots.

Nota: El #013 (CalendarService) no está implementado aún. Esta issue crea la capa de persistencia y la UI de configuración. La integración con el CalendarService ocurrirá cuando #013 se implemente, que deberá leer la config desde `StudioConfig` en lugar de usar constantes.

## 2. OBJETIVO

Implementar la página `/admin/settings` con tres secciones de configuración: horarios laborales, pausas diarias y depósito. Datos persistidos en BD via Server Actions sobre un modelo `StudioConfig` singleton.

## 3. SCOPE

### Prisma
- Añadir modelo `StudioConfig` a `prisma/schema.prisma` (singleton)
- Crear migración: `prisma migrate dev --name add-studio-config`
- Actualizar `prisma/seed.ts` con registro por defecto

### Server Actions — `src/app/admin/settings/actions.ts`
- `updateWorkingHoursAction(data)`: valida Zod → upsert → AuditLog `WORKING_HOURS_UPDATED`
- `updateBreakTimesAction(data)`: valida Zod → upsert breaks (array JSON) → AuditLog `BREAK_TIMES_UPDATED`
- `updateDepositAmountAction(data)`: valida Zod → upsert → AuditLog `DEPOSIT_AMOUNT_UPDATED`

### Página admin
- `src/app/admin/settings/page.tsx`: Server Component que carga `StudioConfig` y renderiza los formularios
- `src/components/admin/working-hours-form.tsx`: Client Component
- `src/components/admin/break-times-form.tsx`: Client Component con lista editable de pausas
- `src/components/admin/deposit-form.tsx`: Client Component

### Tests
- `tests/unit/admin/settings-actions.test.ts`

## 4. ANTI-SCOPE

- Integración del CalendarService con `StudioConfig` (se hace en #013)
- Gestión de horarios por día de la semana (MVP: mismo horario todos los días)
- Días festivos o excepciones de días concretos (eso son BlockedPeriods, issue #041)
- Notificaciones al cambiar configuración

## 5. ARCHIVOS AFECTADOS

- `issues-docs/045-admin-settings-config.md` (nuevo)
- `prisma/schema.prisma` (modificado — añadir StudioConfig)
- `prisma/seed.ts` (modificado — singleton por defecto)
- `src/app/admin/settings/actions.ts` (nuevo)
- `src/app/admin/settings/page.tsx` (modificado — reemplazar stub)
- `src/components/admin/working-hours-form.tsx` (nuevo)
- `src/components/admin/break-times-form.tsx` (nuevo)
- `src/components/admin/deposit-form.tsx` (nuevo)
- `tests/unit/admin/settings-actions.test.ts` (nuevo)

## 6. MODELO PRISMA

```prisma
model StudioConfig {
  id                          String   @id @default(uuid())
  workingStartHour            Int      @default(10)
  workingStartMinute          Int      @default(0)
  workingEndHour              Int      @default(20)
  workingEndMinute            Int      @default(0)
  slotDurationMinutes         Int      @default(30)
  consultationDurationMinutes Int      @default(60)
  depositAmount               Decimal  @default(50.00) @db.Decimal(10, 2)
  breaks                      Json     @default("[]")
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  @@map("studio_config")
}
```

Tipo de break (almacenado en `breaks: Json`):
```ts
type BreakTime = {
  id: string          // uuid local para key en UI
  label: string       // e.g. "Pausa comida"
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}
```

## 7. ID SINGLETON

```ts
export const STUDIO_CONFIG_ID = "00000000-0000-0000-0000-000000000003"
```

## 8. SCHEMAS ZOD

### updateWorkingHoursAction
```ts
z.object({
  workingStartHour: z.number().int().min(0).max(23),
  workingStartMinute: z.number().int().min(0).max(59),
  workingEndHour: z.number().int().min(0).max(23),
  workingEndMinute: z.number().int().min(0).max(59),
  slotDurationMinutes: z.number().int().min(15).max(120),
  consultationDurationMinutes: z.number().int().min(30).max(240),
})
// Validación cruzada: workingStart < workingEnd
// Validación cruzada: workingEnd - workingStart >= consultationDurationMinutes
```

### updateBreakTimesAction
```ts
z.object({
  breaks: z.array(z.object({
    id: z.string().uuid(),
    label: z.string().min(1).max(100),
    startHour: z.number().int().min(0).max(23),
    startMinute: z.number().int().min(0).max(59),
    endHour: z.number().int().min(0).max(23),
    endMinute: z.number().int().min(0).max(59),
  })).max(10),
})
// Validación cruzada por cada break: startHour:startMinute < endHour:endMinute
// Validación cruzada: breaks dentro del horario laboral
```

### updateDepositAmountAction
```ts
z.object({
  depositAmount: z.number({ error: "Debe ser un número" }).min(0).max(9999.99),
})
```

## 9. REGLAS DE NEGOCIO

- RB-009: horario por defecto 10:00–20:00
- RB-010: las pausas configuradas bloquean slots automáticamente (lo aplicará CalendarService en #013)
- RB-020: toda acción administrativa genera AuditLog
- Patrón singleton: siempre existe un registro; si no existe, upsert lo crea
- `workingStart` debe ser estrictamente menor que `workingEnd`
- La ventana laboral (`workingEnd - workingStart`) debe ser ≥ `consultationDurationMinutes`
- Cada break debe estar contenido dentro del horario laboral
- `startHour:startMinute < endHour:endMinute` en cada break
- Sin solapamiento entre breaks (validación server-side)

## 10. CRITERIOS DE ACEPTACIÓN

- [ ] `StudioConfig` existe en schema Prisma y migración aplicada
- [ ] Seed crea singleton con valores por defecto
- [ ] `updateWorkingHoursAction` valida y persiste horario laboral + AuditLog
- [ ] `updateWorkingHoursAction` rechaza workingStart ≥ workingEnd
- [ ] `updateWorkingHoursAction` rechaza ventana < consultationDurationMinutes
- [ ] `updateBreakTimesAction` valida y persiste breaks (JSON) + AuditLog
- [ ] `updateBreakTimesAction` rechaza break con start ≥ end
- [ ] `updateDepositAmountAction` valida y persiste depósito + AuditLog
- [ ] Sin sesión admin → error UNAUTHORIZED en todas las actions
- [ ] Formularios muestran estado loading/success/error (UX-001 §15)
- [ ] Formularios pre-cargados con valores actuales
- [ ] Tests pasan

## 11. EDGE CASES

- Sin registro en BD (antes del primer seed) → page carga defaults, upsert crea el singleton
- `consultationDurationMinutes` > ventana laboral → rechazado (no podrían existir slots)
- Array `breaks` vacío → válido (sin pausas)
- Break que empieza y termina en el mismo minuto → rechazado
- `depositAmount` = 0 → válido (consulta gratuita, decisión del artista)
- Break fuera del horario laboral → rechazado

## 12. TESTS REQUERIDOS

`tests/unit/admin/settings-actions.test.ts`:

**updateWorkingHoursAction:**
- sin sesión → UNAUTHORIZED
- workingStartHour ≥ workingEndHour → error
- ventana laboral < consultationDurationMinutes → error
- datos válidos → upsert + AuditLog `WORKING_HOURS_UPDATED`

**updateBreakTimesAction:**
- sin sesión → UNAUTHORIZED
- break con start ≥ end → error
- breaks vacío → success
- datos válidos → upsert + AuditLog `BREAK_TIMES_UPDATED`

**updateDepositAmountAction:**
- sin sesión → UNAUTHORIZED
- amount negativo → error
- amount = 0 → success (consulta gratuita permitida)
- datos válidos → upsert + AuditLog `DEPOSIT_AMOUNT_UPDATED`

## 13. DEPENDENCIAS

- #037 — Admin login ✅
- #013 — CalendarService (no implementado aún; esta issue crea la config que #013 consumirá)

## 14. DEFINITION OF DONE

- [ ] Modelo Prisma añadido y migración creada
- [ ] Seed actualizado
- [ ] Tres Server Actions implementadas con validación Zod cruzada
- [ ] Página `/admin/settings` funcional con tres formularios
- [ ] AuditLog generado en cada actualización
- [ ] Tests pasan
- [ ] CI verde
- [ ] PR creado
- [ ] Issue cerrada
