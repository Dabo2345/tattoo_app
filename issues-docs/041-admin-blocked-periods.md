# ISSUE DOC #041 — Admin: bloquear períodos + API POST /api/admin/blocked-periods

## CONTEXTO

El modelo `BlockedPeriod` ya existe en el schema (#008). Según RB-011, los BlockedPeriods
tienen prioridad absoluta sobre cualquier disponibilidad y bloquean slots automáticamente.
Esta issue expone la gestión de períodos bloqueados al admin: crear y eliminar bloqueos,
con AuditLog (RB-020).

---

## OBJETIVO

1. **`POST /api/admin/blocked-periods`** — crear BlockedPeriod, AuditLog
2. **`DELETE /api/admin/blocked-periods/[id]`** — eliminar BlockedPeriod, AuditLog
3. **`GET /api/admin/blocked-periods`** — listar BlockedPeriods (con filtro opcional de rango)
4. **UI en `WeeklyAgenda`** — formulario de bloqueo accesible desde el header del dashboard

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/api/admin/blocked-periods/route.ts` | Crear — GET + POST |
| `src/app/api/admin/blocked-periods/[id]/route.ts` | Crear — DELETE |
| `src/components/admin/blocked-period-form.tsx` | Crear — formulario de bloqueo |
| `src/app/admin/page.tsx` | Modificar — añadir botón y formulario al dashboard |
| `tests/integration/admin/blocked-periods.test.ts` | Crear |
| `issues-docs/041-admin-blocked-periods.md` | Crear — este documento |

---

## ANTI-SCOPE

- NO modificar CalendarService (ya aplica BlockedPeriods en slots)
- NO mostrar BlockedPeriods en la UI del cliente (solo admin)
- NO editar un BlockedPeriod existente (solo crear/eliminar)
- NO validar solapamiento entre BlockedPeriods (permitido)

---

## CONTRATO DE API

### POST /api/admin/blocked-periods

**Body:**
```json
{ "startsAt": "ISO string", "endsAt": "ISO string", "reason": "string (opcional)" }
```

**Respuesta 200:**
```json
{ "success": true, "data": { "blockedPeriod": { "id": "uuid", "startsAt": "...", "endsAt": "...", "reason": "..." } } }
```

**Errores:**
- `400` — body inválido, `startsAt >= endsAt`
- `401` — sin sesión

---

### DELETE /api/admin/blocked-periods/[id]

**Respuesta 200:**
```json
{ "success": true, "data": { "id": "uuid" } }
```

**Errores:**
- `401` — sin sesión
- `404` — período no encontrado

---

### GET /api/admin/blocked-periods

**Query params (opcionales):** `from` (ISO), `to` (ISO)

**Respuesta 200:**
```json
{ "success": true, "data": { "blockedPeriods": [{ "id", "startsAt", "endsAt", "reason" }] } }
```

---

## FLUJO DE EJECUCIÓN

### POST
1. `withAdminAuth` → 401
2. Validar body con Zod (startsAt, endsAt ISO válidos, `startsAt < endsAt`)
3. `prisma.blockedPeriod.create`
4. `prisma.auditLog.create` con `action = "BLOCKED_PERIOD_CREATED"`
5. Retornar el período creado

### DELETE
1. `withAdminAuth` → 401
2. `findFirst` → 404 si no existe
3. `prisma.blockedPeriod.delete`
4. `prisma.auditLog.create` con `action = "BLOCKED_PERIOD_DELETED"`
5. Retornar `{ success: true, data: { id } }`

### GET
1. `withAdminAuth` → 401
2. Parsear `from`/`to` opcionales con Zod
3. `findMany` con filtro de rango si se proporciona, `orderBy: startsAt asc`

### UI (BlockedPeriodForm + admin page)
- Botón "Bloquear período" en el header del dashboard
- Al hacer click → formulario inline con inputs `startsAt`, `endsAt`, `reason?`
- Tras crear: formulario se oculta y se muestra mensaje de confirmación
- Lista de períodos activos con botón eliminar junto a cada uno

---

## REGLAS DE NEGOCIO

- RB-011: BlockedPeriods tienen prioridad absoluta sobre cualquier disponibilidad
- RB-020: AuditLog en cada acción admin
- `startsAt` debe ser estrictamente anterior a `endsAt` (validación server-side)

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Admin puede crear BlockedPeriod con startsAt, endsAt y reason opcional
- [ ] `startsAt >= endsAt` → 400
- [ ] Admin puede eliminar BlockedPeriod existente
- [ ] Eliminar período inexistente → 404
- [ ] GET lista períodos con filtro de rango opcional
- [ ] AuditLog creado en POST y DELETE
- [ ] UI permite crear y eliminar períodos desde el dashboard
- [ ] TypeScript sin errores, lint limpio

---

## EDGE CASES

- `startsAt === endsAt` → 400 VALIDATION_ERROR
- Eliminar período ya eliminado → 404
- GET sin filtros devuelve todos los períodos

---

## TESTS REQUERIDOS

### Integration (`tests/integration/admin/blocked-periods.test.ts`)

**POST (6 tests):**
- 401 sin sesión
- 400 si startsAt >= endsAt
- 400 si body inválido
- 200 crea el período y devuelve los datos
- Crea AuditLog BLOCKED_PERIOD_CREATED
- Persiste en DB con los valores correctos

**DELETE (4 tests):**
- 401 sin sesión
- 404 si no existe
- 200 elimina y retorna el id
- Crea AuditLog BLOCKED_PERIOD_DELETED

**GET (3 tests):**
- 401 sin sesión
- 200 lista todos los períodos sin filtro
- 200 filtra por rango from/to

---

## DEPENDENCIAS

- #039 — withAdminAuth disponible
- #008 — modelo BlockedPeriod en schema

---

## DEFINITION OF DONE

- [ ] 3 routes implementadas (GET+POST en route.ts, DELETE en [id]/route.ts)
- [ ] `BlockedPeriodForm` con lógica de crear/listar/eliminar
- [ ] 13+ tests, todos pasando
- [ ] TypeScript sin errores, lint limpio
- [ ] GitHub Issue #41 cerrado
- [ ] PR creado
