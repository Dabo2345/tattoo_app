# ISSUE DOC #059 — Clean code: admin routes — patrón de respuesta y acceso a datos

## CONTEXTO

Los admin routes `cancel` y `reschedule` usan patrones de implementación obsoletos inconsistentes con el resto del proyecto:

### Problema 1: Respuestas manuales
```typescript
// Patrón antiguo (admin routes)
return Response.json({ success: false, error: { code: "...", message: "..." } }, { status: 400 })

// Patrón moderno (rutas cliente)
throw new ValidationError(...)  // withErrorHandler lo convierte automáticamente
// o
return createApiResponse(data)
```

### Problema 2: Prisma directo en route handlers
```typescript
// Patrón antiguo (admin routes)
const appointment = await prisma.appointment.findFirst({ where: { id, deletedAt: null } })
await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } })
await prisma.auditLog.create({ data: { ... } })

// Patrón moderno (rutas cliente)
const appointment = await bookingRepository.findAppointmentById(id)
await bookingRepository.cancelAppointment(id)
await auditService.log("APPOINTMENT_CANCELLED", id, { ... })
```

### Problema 3: withAdminAuth vs withErrorHandler
Los admin routes usan `withAdminAuth` (que no convierte errores automáticamente), mientras que las rutas modernas usan `withErrorHandler` (que convierte Zod/Prisma errors automáticamente y reporta a Sentry).

**Root cause**: Los admin routes (#037-#045) se implementaron antes de que se estableciera el patrón moderno con `withErrorHandler`, `createApiResponse` y repositorios.

## OBJETIVO

Migrar `admin/cancel` y `admin/reschedule` al patrón moderno:
- `withErrorHandler` para manejo de errores automático
- `withAdminAuth` dentro de `withErrorHandler` (o combinado)
- `bookingRepository` para acceso a datos
- `auditService.log()` en lugar de `prisma.auditLog.create()` directamente
- `createApiResponse()` para respuestas

## SCOPE

- `src/app/api/admin/appointments/[id]/cancel/route.ts`
- `src/app/api/admin/appointments/[id]/reschedule/route.ts`

## ANTI-SCOPE

- No cambiar el comportamiento de negocio (eso es #053, #055)
- No migrar otros admin routes en este issue (alcance controlado)
- No cambiar `withAdminAuth` ni `withErrorHandler`

## ARCHIVOS AFECTADOS

```
src/app/api/admin/appointments/[id]/cancel/route.ts       ← MODIFIED
src/app/api/admin/appointments/[id]/reschedule/route.ts   ← MODIFIED
issues-docs/059-clean-code-admin-routes-pattern.md        ← NEW
```

## FLUJO DE EJECUCIÓN

### Para admin/cancel/route.ts

Ver el patrón de referencia en `src/app/api/appointments/[id]/cancel/route.ts`:

```typescript
export const POST = withErrorHandler(
  async (request: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    // withAdminAuth para verificar sesión
    const session = await requireAdminSession(request) // o el helper apropiado
    const { id } = await ctx.params
    
    const appointment = await bookingRepository.findAppointmentById(id)
    if (!appointment) throw new AppointmentNotFoundError()
    
    // ... lógica de negocio
    
    await auditService.log("APPOINTMENT_CANCELLED", id, {
      entityType: "Appointment",
      adminUserId: session.user.id,
      metadata: { ... }
    })
    
    return createApiResponse({ ... })
  }
)
```

### Para admin/reschedule/route.ts
Mismo patrón. Después de aplicar #055 (BlockedPeriod fix), el handler estará limpio.

**Nota**: Verificar si `withAdminAuth` puede combinarse con `withErrorHandler` o si hay que preservar el wrapper actual. Si no es posible combinarlos de forma limpia, mantener `withAdminAuth` y solo migrar el resto del patrón.

## CRITERIOS DE ACEPTACIÓN

- [ ] No hay `Response.json({ success: false, error: ... })` directo en los handlers
- [ ] No hay `prisma.appointment` accedido directamente en los route handlers
- [ ] No hay `prisma.auditLog.create()` directo en los route handlers
- [ ] `createApiResponse()` usado para respuestas de éxito
- [ ] `auditService.log()` usado para audit logs
- [ ] `bookingRepository` usado para acceso a appointments
- [ ] Tests de integración siguen pasando

## TESTS REQUERIDOS

No requiere tests nuevos. Los tests de integración existentes deben seguir pasando (el comportamiento externo no cambia).

## DOCUMENTACIÓN AFECTADA

- `docs/Documento 15 — BACK-001 ...` → Confirmar que el patrón de handlers admin usa withErrorHandler + repositorios

## DEPENDENCIAS

- #053 (admin cancel con Stripe refund) — debe hacerse primero para que no haya conflicto de edición
- #055 (admin reschedule BlockedPeriod) — debe hacerse primero

## DEFINITION OF DONE

- [ ] Admin cancel y reschedule usan patrón moderno
- [ ] `pnpm test --run` verde
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
