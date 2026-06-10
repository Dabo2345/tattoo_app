# ISSUE DOC #040 — Admin: cancelar y reprogramar citas desde panel

## CONTEXTO

El panel admin (#038) muestra el detalle de cada cita pero no permite acciones sobre ella.
Esta issue añade las dos operaciones de mutación más habituales: cancelar y reprogramar.
Ambas deben aplicar la DepositPolicy (RB-013/014), registrar AuditLog (RB-020) y
refrescar la vista en tiempo real sin recargar la página.

Los reembolsos Stripe reales se implementarán más adelante junto con el módulo de pagos.
Esta issue calcula la elegibilidad (`refundEligible`) y la devuelve en la respuesta.

---

## OBJETIVO

1. **`POST /api/admin/appointments/[id]/cancel`** — cancela la cita, aplica DepositPolicy, AuditLog
2. **`POST /api/admin/appointments/[id]/reschedule`** — reprograma con nuevo slot, verifica disponibilidad, AuditLog
3. **`DetailPanel`** actualizado en `WeeklyAgenda` con botones Cancel/Reschedule + flujo de confirmación

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/api/admin/appointments/[id]/cancel/route.ts` | Crear |
| `src/app/api/admin/appointments/[id]/reschedule/route.ts` | Crear |
| `src/components/admin/weekly-agenda.tsx` | Modificar — `DetailPanel` con acciones |
| `tests/integration/admin/cancel.test.ts` | Crear |
| `tests/integration/admin/reschedule.test.ts` | Crear |
| `tests/unit/admin/weekly-agenda-actions.test.tsx` | Crear |
| `issues-docs/040-admin-cancel-reschedule.md` | Crear — este documento |

---

## ANTI-SCOPE

- NO procesar reembolso real en Stripe (módulo de pagos pendiente)
- NO enviar notificaciones email (NotificationService se implementa en #049)
- NO implementar BlockedPeriods en la verificación de disponibilidad (es #041)
- NO modificar el flujo de cancelación del cliente (MagicLink)
- NO paginación ni búsqueda en la lista de citas

---

## CONTRATO DE API

### POST /api/admin/appointments/[id]/cancel

**Body:** vacío (no requiere body)

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "appointment": { "id": "uuid", "status": "CANCELLED" },
    "refundEligible": true
  }
}
```

**Errores:**
- `401` — sin sesión
- `404` — cita no encontrada
- `409` — cita ya cancelada o completada (`ALREADY_CANCELLED`)

---

### POST /api/admin/appointments/[id]/reschedule

**Body:**
```json
{ "newStartAt": "2026-07-20T11:00:00.000Z" }
```

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "uuid",
      "startsAt": "2026-07-20T11:00:00.000Z",
      "endsAt": "2026-07-20T12:00:00.000Z"
    }
  }
}
```

**Errores:**
- `400` — `newStartAt` inválido o fuera del horario laboral
- `401` — sin sesión
- `404` — cita no encontrada
- `409` — slot ocupado por otra cita (`SLOT_NOT_AVAILABLE`)

---

## FLUJO DE EJECUCIÓN

### Cancel
1. `withAdminAuth` → 401 si sin sesión
2. Cargar `appointment` por `id` (donde `deletedAt = null`) → 404 si no existe
3. Si `status IN [CANCELLED, COMPLETED, NO_SHOW]` → 409 `ALREADY_CANCELLED`
4. `refundEligible = daysUntilAppointment(startsAt) >= 4` (RB-013/014)
5. Prisma: `update` `status = CANCELLED`
6. Prisma: crear `AuditLog` con `action = "APPOINTMENT_CANCELLED"`, `entityId`, `adminUserId`
7. Retornar `{ success, data: { appointment, refundEligible } }`

### Reschedule
1. `withAdminAuth` → 401 si sin sesión
2. Validar body: `newStartAt` ISO válido con Zod
3. Cargar `appointment` → 404 si no existe
4. Calcular `duration = endsAt - startsAt` (en ms)
5. Calcular `newEndsAt = newStartAt + duration`
6. Comprobar conflictos: `findFirst` donde `id ≠ currentId`, `deletedAt = null`, `status NOT IN [CANCELLED]`, solapamiento temporal
7. Si conflicto → 409 `SLOT_NOT_AVAILABLE`
8. Prisma: `update` `startsAt`, `endsAt`
9. Prisma: crear `AuditLog` con `action = "APPOINTMENT_RESCHEDULED"`, metadata `{ oldStartAt, newStartAt }`
10. Retornar `{ success, data: { appointment } }`

### UI (DetailPanel)
- Estado adicional: `view: "detail" | "cancel-confirm" | "reschedule-form" | "reschedule-confirm"`
- Botón "Cancelar cita" → `cancel-confirm`: muestra advertencia de depósito + botón confirmar
- Botón "Reprogramar" → `reschedule-form`: input `datetime-local` + botón siguiente
- En `reschedule-form`: botón "Confirmar" → `reschedule-confirm`: resume de cambio + botón confirmar
- Tras confirmar → llama al API, en éxito: cierra panel y `onMutate()` callback para refrescar datos
- Citas con `status IN [CANCELLED, COMPLETED, NO_SHOW]` no muestran los botones de acción

---

## REGLAS DE NEGOCIO

- RB-013: cancelación con ≥ 4 días → `refundEligible = true`
- RB-014: cancelación con < 4 días → `refundEligible = false`
- RB-015: reprogramar con < 4 días se trata como una nueva reserva (no aplica DepositPolicy en reschedule — solo en cancel)
- RB-020: toda acción admin → AuditLog obligatorio
- Solo se pueden cancelar/reprogramar citas con status `PENDING_PAYMENT` o `CONFIRMED`
- La duración de la cita se preserva al reprogramar

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Admin puede cancelar una cita desde el panel de detalle
- [ ] Cancelación muestra pantalla de confirmación antes de ejecutar
- [ ] `refundEligible` devuelto correctamente según la regla de 4 días
- [ ] AuditLog creado en ambas acciones
- [ ] Admin puede reprogramar introduciendo nueva fecha y hora
- [ ] Reprogramar verifica disponibilidad (409 si slot ocupado)
- [ ] La duración de la cita se mantiene al reprogramar
- [ ] Tras la acción, la agenda se refresca sin recargar la página
- [ ] Citas ya canceladas/completadas no muestran botones de acción
- [ ] TypeScript sin errores, lint limpio

---

## EDGE CASES

- Intentar cancelar una cita ya cancelada → 409
- `newStartAt` en el pasado → permitido (no hay restricción en el admin)
- Solapamiento exacto de horarios → considerado conflicto
- Cita de tipo TATTOO_SESSION vs CONSULTATION — misma lógica de cancelación

---

## TESTS REQUERIDOS

### Integration (mocking Prisma + `withAdminAuth`)

**cancel.test.ts (7 tests):**
- 401 sin sesión
- 404 si cita no existe
- 409 si ya cancelada
- 200 con `refundEligible = true` (>= 4 días)
- 200 con `refundEligible = false` (< 4 días)
- Crea AuditLog con acción correcta
- Devuelve status `CANCELLED` en la respuesta

**reschedule.test.ts (8 tests):**
- 401 sin sesión
- 404 si cita no existe
- 400 si body inválido
- 409 si slot ocupado
- 200 en caso exitoso
- `newEndsAt` calculado correctamente (misma duración)
- Crea AuditLog con `APPOINTMENT_RESCHEDULED`
- No genera conflicto si el único solapante es la propia cita

### Unit (`tests/unit/admin/weekly-agenda-actions.test.tsx`)

- Botones Cancel/Reschedule visibles en cita CONFIRMED
- Botones NO visibles en cita CANCELLED
- Click Cancel → muestra pantalla de confirmación
- Click confirmar cancelación → llama fetch POST cancel
- Click Reschedule → muestra formulario con input de fecha
- Tras reschedule exitoso → llama onMutate y cierra panel

---

## DEPENDENCIAS

- #039 — API admin/calendar completada
- #038 — `WeeklyAgenda` con `DetailPanel` existente

---

## DEFINITION OF DONE

- [ ] Rutas cancel y reschedule implementadas
- [ ] `DetailPanel` actualizado con flujo de acciones
- [ ] 15+ tests (integración + unidad), todos pasando
- [ ] TypeScript sin errores
- [ ] Lint limpio
- [ ] GitHub Issue #40 cerrado
- [ ] PR creado
