# ISSUE DOC #039 — API GET /api/admin/calendar y lista de citas admin

## CONTEXTO

El `WeeklyAgenda` (#038) ya está construido y espera datos de `GET /api/admin/calendar`.
Sin esta API el dashboard muestra siempre estado de error. Esta issue implementa las dos
rutas de lectura del panel admin: la vista semanal (usada por el dashboard) y la lista
completa de citas (base para el panel de gestión #040).

Ambas rutas son de solo lectura — no requieren AuditLog.

---

## OBJETIVO

1. **`GET /api/admin/calendar`** — citas en un rango de fechas (Lun–Dom de la semana seleccionada)
2. **`GET /api/admin/appointments`** — lista completa con filtros opcionales (status, type, from, to)

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/api/admin/calendar/route.ts` | Crear — Route Handler |
| `src/app/api/admin/appointments/route.ts` | Crear — Route Handler |
| `tests/integration/admin/calendar.test.ts` | Crear — tests de integración |
| `tests/integration/admin/appointments.test.ts` | Crear — tests de integración |
| `issues-docs/039-api-admin-calendar.md` | Crear — este documento |

---

## ANTI-SCOPE

- NO implementar POST, PATCH ni DELETE de citas (eso es #040)
- NO implementar BlockedPeriods en el calendario (eso es #041)
- NO añadir paginación a `/appointments` (suficiente con limit básico)
- NO exponer datos de Payment desde estas rutas
- NO modificar el componente `WeeklyAgenda`

---

## CONTRATO DE API

### GET /api/admin/calendar

**Query params (obligatorios):** `from` (ISO), `to` (ISO)

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "type": "CONSULTATION | TATTOO_SESSION",
        "status": "PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW",
        "startsAt": "2026-07-13T10:00:00.000Z",
        "endsAt": "2026-07-13T11:00:00.000Z",
        "client": { "name": "string", "email": "string", "phone": "string" }
      }
    ]
  }
}
```

**Respuesta 400** — params ausentes o inválidos:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

**Respuesta 401** — sin sesión admin:
```json
{ "success": false, "error": "No autorizado" }
```

---

### GET /api/admin/appointments

**Query params (todos opcionales):**
- `status`: `PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW`
- `type`: `CONSULTATION | TATTOO_SESSION`
- `from`: ISO date string
- `to`: ISO date string

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "appointments": [...],
    "total": 42
  }
}
```

---

## FLUJO DE EJECUCIÓN

### /api/admin/calendar
1. `withAdminAuth` valida sesión → 401 si ausente
2. Parsear y validar `from` y `to` con Zod (obligatorios, fechas ISO válidas)
3. Prisma: `findMany` en `appointments` donde `startsAt >= from AND startsAt <= to`
4. Incluir `client` con `select: { name, email, phone }`
5. Mapear a formato de respuesta (sin exponer campos internos)
6. Retornar `{ success: true, data: { appointments } }`

### /api/admin/appointments
1. `withAdminAuth` valida sesión → 401 si ausente
2. Parsear y validar query params opcionales con Zod
3. Construir filtro Prisma dinámico
4. Prisma: `findMany` con `include: { client: true }` y `orderBy: { startsAt: 'desc' }`
5. Retornar `{ success: true, data: { appointments, total } }`

---

## REGLAS DE NEGOCIO

- Solo citas NO borradas (`deletedAt: null`)
- El campo `phone` del cliente puede no existir — incluir solo si presente (schema lo tiene como único, siempre existe)
- Los filtros `from`/`to` son inclusivos en el extremo `from`, exclusivo en `to` para `/calendar`
  (rango lunes 00:00 UTC → domingo 23:59:59 UTC)
- Resultados ordenados por `startsAt ASC` en `/calendar`, `startsAt DESC` en `/appointments`

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Sin sesión → 401 en ambos endpoints
- [ ] `GET /api/admin/calendar` sin params → 400 VALIDATION_ERROR
- [ ] `GET /api/admin/calendar?from=...&to=...` → 200 con citas del rango
- [ ] `GET /api/admin/appointments` → 200 con todas las citas
- [ ] Filtros `status` y `type` funcionan correctamente
- [ ] Las citas canceladas (CANCELLED) se incluyen en los resultados
- [ ] TypeScript sin errores, lint limpio
- [ ] Tests pasan

---

## EDGE CASES

- Rango vacío (sin citas) → devuelve `appointments: []` (no error)
- `from` posterior a `to` → 400 VALIDATION_ERROR
- `from` o `to` inválidos (no son fechas) → 400 VALIDATION_ERROR
- Filtro `status` con valor inválido → 400 VALIDATION_ERROR

---

## TESTS REQUERIDOS

### Integration (`tests/integration/admin/`)

**calendar.test.ts:**
- Sin sesión → 401
- Sin params `from`/`to` → 400
- `from` posterior a `to` → 400
- Fecha inválida → 400
- Con params válidos → 200 con appointments del rango
- Rango sin citas → 200 con array vacío

**appointments.test.ts:**
- Sin sesión → 401
- Sin filtros → 200 con todos las citas
- Filtro `status=CONFIRMED` → solo citas confirmadas
- Filtro `type=CONSULTATION` → solo consultas
- Filtro `from`/`to` → citas en ese rango

---

## DEPENDENCIAS

- #011 — `withAdminAuth` disponible (completado)
- #008 — Schema Prisma con modelos `Appointment` y `Client` (completado)
- #038 — `WeeklyAgenda` espera este contrato (completado)

---

## DEFINITION OF DONE

- [ ] `src/app/api/admin/calendar/route.ts` implementado
- [ ] `src/app/api/admin/appointments/route.ts` implementado
- [ ] Tests: mínimo 11 casos, todos pasando
- [ ] TypeScript sin errores
- [ ] Lint limpio
- [ ] GitHub Issue #39 cerrado
- [ ] PR creado
