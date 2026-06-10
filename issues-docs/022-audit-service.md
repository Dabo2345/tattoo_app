# ISSUE DOC — #022: AuditService: registro de acciones del sistema

## CONTEXTO
Actualmente `createAuditLog` vive en `bookingRepository`, lo que viola
la separación de módulos de BACK-001 (audit es su propio módulo).
Múltiples servicios y routes lo llaman directamente, acoplando el audit
al módulo de booking.

## OBJETIVO
Crear el módulo `audit` con su repositorio y servicio, y reemplazar
todas las llamadas a `bookingRepository.createAuditLog` por `auditService.log`.

## SCOPE
- `src/modules/audit/repositories/audit-repository.ts` — acceso a Prisma
- `src/modules/audit/services/audit-service.ts` — servicio público
- `src/modules/booking/repositories/booking-repository.ts` — eliminar `createAuditLog`
- `src/app/api/appointments/[id]/cancel/route.ts` — usar `auditService.log`
- `src/app/api/appointments/[id]/reschedule/route.ts` — usar `auditService.log`
- `src/app/api/webhooks/stripe/route.ts` — usar `auditService.log`
- `src/modules/booking/services/booking-service.ts` — usar `auditService.log`
- `src/modules/payment/services/deposit-policy.ts` — usar `auditService.log`
- Tests afectados: deposit-policy, webhook-handler, cancel-appointment, reschedule-appointment
- `tests/unit/modules/audit/audit-service.test.ts` — tests unitarios nuevos

## ANTI-SCOPE
- No implementar UI de audit logs (issue #039+)
- No añadir campos nuevos al modelo AuditLog
- No implementar paginación o búsqueda de logs

## FLUJO DE EJECUCIÓN
1. Crear `auditRepository.create(data)` — escritura directa a Prisma
2. Crear `auditService.log(action, entityId?, options?)` — wrapper público
3. Reemplazar `bookingRepository.createAuditLog(...)` → `auditService.log(...)`
4. Eliminar `createAuditLog` de `bookingRepository`
5. Actualizar todos los tests que mockeaban `bookingRepository.createAuditLog`

## INTERFAZ DEL SERVICIO
```ts
auditService.log(
  action: string,
  entityId?: string,
  options?: {
    entityType?: string
    clientId?: string
    adminUserId?: string
    metadata?: Record<string, unknown>
  }
): Promise<void>
```

## REGLAS DE NEGOCIO
- RB-020: toda acción administrativa relevante genera un AuditLog
- El servicio nunca lanza error al cliente (errores de audit son silenciosos)

## CRITERIOS DE ACEPTACIÓN
- [ ] `auditService.log` escribe en `audit_logs`
- [ ] Ningún módulo llama directamente a `bookingRepository.createAuditLog`
- [ ] `createAuditLog` eliminado de `bookingRepository`
- [ ] Tests pasando

## DEPENDENCIAS
- #011 ✅ — API helpers y middleware

## DEFINITION OF DONE
- [ ] Módulo audit creado
- [ ] Todas las llamadas migradas
- [ ] Tests pasando
- [ ] CI verde
