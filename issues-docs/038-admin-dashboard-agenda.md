# ISSUE DOC #038 — Dashboard admin (/admin): agenda semanal

## CONTEXTO

El artista necesita un dashboard central donde ver todas las citas de la semana de un vistazo,
navegar entre semanas y acceder al detalle de cada cita. Es la pantalla principal tras el login.

La protección de ruta ya existe via middleware (Better Auth, #010). El layout admin con
`AdminHeader` también existe. Esta issue reemplaza el placeholder con la agenda funcional.

La API `GET /api/admin/calendar` se implementará en #039 (que depende de esta issue).
El componente construye contra ese contrato y mostrará estado vacío mientras #039 no esté.

---

## OBJETIVO

1. **`WeeklyAgenda`** — client component con:
   - Grid de 7 columnas (lunes → domingo) con las citas de la semana
   - Navegación semana anterior / semana siguiente / botón "Hoy"
   - Citas coloreadas por estado (CONFIRMED, PENDING_PAYMENT, CANCELLED, etc.)
   - Click en cita → panel de detalle inline con todos los campos
   - Estados: loading, vacío, error de red

2. **`page.tsx`** — reemplaza placeholder, renderiza `WeeklyAgenda`

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/admin/page.tsx` | Modificar — reemplazar placeholder |
| `src/components/admin/weekly-agenda.tsx` | Crear — Client Component |
| `tests/unit/admin/weekly-agenda.test.tsx` | Crear — tests unitarios |

---

## ANTI-SCOPE

- NO implementar la API `/api/admin/calendar` (eso es #039)
- NO editar ni cancelar citas desde este dashboard (eso es #040)
- NO gestionar BlockedPeriods desde aquí (eso es #041)
- NO modificar `AdminHeader` ni el layout
- NO usar TanStack Query (aún no configurado — plain fetch con useEffect)

---

## CONTRATO DE API (contra el que se construye)

### GET /api/admin/calendar

**Query params:** `from` (ISO), `to` (ISO)

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "string",
        "type": "CONSULTATION | TATTOO_SESSION",
        "status": "PENDING_PAYMENT | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW",
        "startsAt": "ISO string",
        "endsAt": "ISO string",
        "client": { "name": "string", "email": "string", "phone": "string" }
      }
    ]
  }
}
```

---

## FLUJO DE EJECUCIÓN

1. Componente calcula lunes de la semana actual como estado inicial
2. `useEffect` fetcha `/api/admin/calendar?from=...&to=...` con el rango lunes-domingo
3. Renderiza grid de 7 columnas; cada cita aparece en la columna del día correspondiente
4. Botones `←` / `→` modifican `currentWeekStart` en ±7 días → nuevo fetch
5. Botón "Hoy" resetea `currentWeekStart` a la semana actual
6. Click en cita → `selectedAppointment` state → panel de detalle visible

---

## REGLAS DE NEGOCIO

- Horario laboral 10:00–20:00 (RB-009) — las citas siempre caen en este rango
- Solo el artista (ADMIN) puede ver esta vista — garantizado por middleware
- Las citas con status CANCELLED se muestran atenuadas pero visibles

---

## COLORES POR ESTADO (UI-001)

| Status | Color |
|--------|-------|
| CONFIRMED | verde (`text-green-400`, `border-green-500/40`, `bg-green-500/10`) |
| PENDING_PAYMENT | ámbar (`text-amber-400`, `border-amber-500/40`, `bg-amber-500/10`) |
| CANCELLED | rojo tenue (`text-red-400/60`, `border-red-500/20`, `bg-red-500/5`) |
| COMPLETED | gris (`text-foreground-muted`, `border-border`, `bg-surface`) |
| NO_SHOW | rojo (`text-red-400`, `border-red-500/40`, `bg-red-500/10`) |

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Dashboard carga las citas de la semana actual al montar
- [ ] Citas con colores distintos según estado
- [ ] Click en cita muestra panel de detalle (nombre, email, teléfono, fecha, hora, tipo, estado)
- [ ] Click fuera del detalle / botón cerrar → oculta el panel
- [ ] Navegación `←` / `→` cambia de semana y hace nuevo fetch
- [ ] Botón "Hoy" vuelve a la semana actual
- [ ] Estado loading visible mientras se carga
- [ ] Sin citas → mensaje vacío por columna o global
- [ ] Error de red → mensaje de error con opción de reintentar
- [ ] Protegido: sin sesión → middleware redirige a `/admin/login` (no responsabilidad de este componente)
- [ ] Todos los tests pasan

---

## EDGE CASES

- Semana actual puede tener 0 citas → mostrar columnas vacías con mensaje
- Citas que abarcan varios días (sesiones largas) → mostrar solo en el día de inicio
- La API devuelve error mientras se navega → mostrar error sin perder la semana visualizada
- El artista hace click en "Hoy" cuando ya está en la semana actual → no hace nada (idempotente)

---

## TESTS REQUERIDOS

### Unit (`tests/unit/admin/weekly-agenda.test.tsx`, happy-dom)

- Renderiza los 7 días de la semana actual (lun–dom)
- Muestra estado loading mientras se carga la API
- Renderiza citas recibidas en el día correcto
- Sin citas → mensaje de agenda vacía
- Click en cita → muestra panel de detalle con nombre del cliente
- Click en botón cerrar del detalle → oculta el panel
- Botón `→` avanza a la semana siguiente y hace nuevo fetch
- Botón `←` retrocede a la semana anterior y hace nuevo fetch
- Botón "Hoy" regresa a la semana actual
- Error de API → muestra mensaje de error

---

## DEPENDENCIAS

- #037 — Admin login funcional (completado)
- #010 — Middleware de protección de rutas (completado)

---

## DEFINITION OF DONE

- [ ] `page.tsx` reemplaza el placeholder
- [ ] `weekly-agenda.tsx` implementa la agenda completa
- [ ] Tests: mínimo 10 casos, todos pasando
- [ ] TypeScript sin errores
- [ ] Lint limpio
- [ ] GitHub Issue #38 cerrado
- [ ] PR creado
