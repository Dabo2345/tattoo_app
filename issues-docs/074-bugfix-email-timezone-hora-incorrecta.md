# ISSUE DOC #074 — Bugfix: email de confirmación muestra hora incorrecta (+2h)

**Issue GitHub:** #074 (Dabo2345/tattoo_app#144)
**Tipo:** bug
**Prioridad:** P1: High
**Rama:** `fix/074-email-timezone`
**Estado:** PENDIENTE
**Fecha:** 2026-06-18

---

## 1. CONTEXTO

Los appointments se almacenan en la base de datos en UTC. El `NotificationService` formatea las fechas/horas para los emails usando `timeZone: "Europe/Madrid"` hardcodeado. En horario de verano (CEST = UTC+2), esto desplaza la hora +2h. Un usuario que reserva a las 10:00 UTC recibe un email que dice las 12:00.

---

## 2. OBJETIVO

Corregir las funciones `formatDate()` y `formatTime()` en `NotificationService` para que muestren la hora en UTC (igual que está almacenada), eliminando el desfase de +2h.

---

## 3. SCOPE

- Cambiar `timeZone: "Europe/Madrid"` a `timeZone: "UTC"` en `formatDate()` y `formatTime()` de `notification-service.ts`
- Todos los métodos de envío que usan estas funciones quedan corregidos automáticamente

---

## 4. ANTI-SCOPE

- NO cambiar la forma en que se almacenan los appointments en DB
- NO añadir configuración de timezone por usuario
- NO modificar templates de email (solo el formateo de fechas en el servicio)

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/modules/notification/services/notification-service.ts` — cambiar `timeZone` en `formatDate()` (línea 31) y `formatTime()` (línea 40)

### Tests
- `tests/unit/modules/notification/notification-service.test.ts` — verificar que los tests de fechas sean consistentes con UTC

### Docs
- `docs/Documento 16 — NOTIF-001 — Sistema de Notificaciones.md` — aclarar que las fechas se muestran en UTC

---

## 6. FLUJO DE EJECUCIÓN

1. En `notification-service.ts`, cambiar `formatDate()`:
   ```typescript
   // ANTES
   timeZone: "Europe/Madrid",
   // DESPUÉS
   timeZone: "UTC",
   ```
2. Cambiar `formatTime()` del mismo modo
3. Verificar que los tests existentes pasan (ya usan fechas UTC en fixtures)
4. Actualizar NOTIF-001 con nota sobre timezone

---

## 7. REGLAS DE NEGOCIO

- **RB-NOTIF-TZ-001:** Las horas en emails se muestran en UTC, igual que se almacenan, para evitar desfases por cambios de horario de verano/invierno.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] Usuario que reserva a las 10:00 UTC recibe email que dice las 10:00
- [ ] Todos los emails afectados (consultation-confirmed, session-confirmed, rescheduled, reminders) muestran hora correcta
- [ ] Tests pasan
- [ ] CI verde

---

## 9. EDGE CASES

- **Cambio de hora DST:** Al usar UTC no hay ambigüedad en cambios de horario de verano/invierno.

---

## 10. TESTS REQUERIDOS

- Tests existentes de `notification-service.test.ts` deben seguir pasando (ya usan fechas UTC)
- No se requieren tests nuevos — el fix es mínimo y los tests existentes cubren el formateo

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `NOTIF-001` | Templates de email | Añadir nota: fechas/horas se muestran en UTC |

---

## 12. DEPENDENCIAS

Ninguna.

---

## 13. DEFINITION OF DONE

- [ ] `formatDate()` y `formatTime()` usan `timeZone: "UTC"`
- [ ] Tests unitarios pasan
- [ ] CI verde
- [ ] NOTIF-001 actualizado
- [ ] PR creado
