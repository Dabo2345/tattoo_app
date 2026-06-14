# ISSUE DOC #053 — Bugfix crítico: admin cancel no ejecuta reembolso Stripe

## CONTEXTO

La ruta `POST /api/admin/appointments/:id/cancel` calcula `refundEligible` pero nunca llama a `depositPolicyService.handleCancellation()`. Cuando el admin cancela una cita con ≥4 días de antelación, el cliente **no recibe el reembolso en Stripe**. El sistema solo marca el appointment como CANCELLED en DB y envía una notificación con información de reembolso potencialmente incorrecta.

La ruta cliente equivalente (`src/app/api/appointments/[id]/cancel/route.ts`) sí llama correctamente a `depositPolicyService`.

**Root cause**: La lógica de cancelación admin fue implementada manualmente sin delegar en el servicio de política de depósito, duplicando la evaluación pero omitiendo la ejecución.

## OBJETIVO

Corregir `src/app/api/admin/appointments/[id]/cancel/route.ts` para que:
1. Llame a `depositPolicyService.handleCancellation()` cuando proceda el reembolso
2. Incluya el resultado del reembolso en el audit log y la respuesta
3. Sea consistente con el comportamiento de la ruta cliente

## SCOPE

- `src/app/api/admin/appointments/[id]/cancel/route.ts` — corrección del handler
- `tests/integration/api/admin-cancel.test.ts` — tests de integración (nuevo o actualizado)

## ANTI-SCOPE

- No modificar `depositPolicyService` ni `bookingRepository`
- No cambiar la ruta cliente (ya funciona correctamente)
- No cambiar el schema de DB

## ARCHIVOS AFECTADOS

```
src/app/api/admin/appointments/[id]/cancel/route.ts   ← MODIFIED
tests/integration/api/admin-cancel.test.ts             ← NEW or MODIFIED
issues-docs/053-bugfix-admin-cancel-stripe-refund.md  ← NEW
docs/Documento 05 — API-001 ...                        ← UPDATE (sección cancel admin)
```

## FLUJO DE EJECUCIÓN

1. Leer el archivo actual completo
2. Eliminar la función local `daysUntil()` (issue #056 la elimina, aquí también)
3. Importar `depositPolicyService` de `@/modules/payment/services/deposit-policy`
4. Reemplazar el bloque de `refundEligible` por una llamada a `depositPolicyService.handleCancellation(id, appointment.startsAt)`
5. Actualizar el audit log para incluir el resultado real del reembolso
6. Actualizar la respuesta con el resultado de `policyResult`
7. Mantener el mock de `notificationService.sendAppointmentCancelled(id)` al final
8. Escribir/actualizar tests

## REGLAS DE NEGOCIO

- **RB-013**: Cancelación ≥4 días antes → reembolso automático Stripe
- **RB-014**: Cancelación <4 días → retención del depósito
- El admin puede cancelar en cualquier momento, las mismas reglas de reembolso aplican

## CÓDIGO ACTUAL (a reemplazar)

```typescript
// INCORRECTO — calcula pero no ejecuta
const refundEligible = daysUntil(appointment.startsAt) >= 4

await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } })
await prisma.auditLog.create({ data: { ..., metadata: { refundEligible } } })
await notificationService.sendAppointmentCancelled(id)
return Response.json({ success: true, data: { appointment: { id, status: "CANCELLED" }, refundEligible } })
```

## CÓDIGO CORRECTO (patrón a seguir)

```typescript
// Aplicar política de depósito (ejecuta reembolso Stripe si procede)
const policyResult = await depositPolicyService.handleCancellation(id, appointment.startsAt)

await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } })

await auditService.log("APPOINTMENT_CANCELLED", id, {
  entityType: "Appointment",
  adminUserId: session.user.id,
  metadata: {
    refunded: policyResult.refunded,
    ...(policyResult.refunded ? { stripeRefundId: policyResult.stripeRefundId } : { reason: policyResult.reason }),
  },
})

await notificationService.sendAppointmentCancelled(id)

return createApiResponse({
  appointment: { id, status: "CANCELLED" },
  refunded: policyResult.refunded,
  ...(policyResult.refunded ? { stripeRefundId: policyResult.stripeRefundId } : {}),
})
```

## CRITERIOS DE ACEPTACIÓN

- [ ] Admin cancela cita con ≥4 días → `depositPolicyService.handleCancellation()` es llamado
- [ ] El reembolso se procesa en Stripe (stripe.refunds.create es llamado)
- [ ] El audit log contiene el stripeRefundId cuando hay reembolso
- [ ] La respuesta incluye `refunded: true/false` con el stripeRefundId si aplica
- [ ] Admin cancela cita con <4 días → no hay reembolso, respuesta con `refunded: false`
- [ ] Si Stripe falla → la cancelación no se ejecuta (RefundFailedError propagado)

## EDGE CASES

- Appointment sin Payment en DB → `PaymentFailedError` propagado
- Stripe network error → `RefundFailedError` → appointment no se cancela
- Appointment ya CANCELLED → respuesta idempotente (ya implementado)

## TESTS REQUERIDOS

```
tests/integration/api/admin-cancel.test.ts
```

- `POST /api/admin/appointments/:id/cancel (admin)`: con ≥4 días → llama depositPolicyService
- Con ≥4 días → Stripe refund ejecutado
- Con <4 días → no Stripe refund, `refunded: false`
- Sin Payment en DB → 500 / error apropiado
- Appointment ya cancelado → respuesta idempotente

## DOCUMENTACIÓN AFECTADA

- `docs/Documento 05 — API-001 ...` → Actualizar sección `DELETE/POST /api/admin/appointments/:id/cancel` con el comportamiento real del reembolso

## DEPENDENCIAS

- Ninguna (las rutas involucradas ya existen)

## DEFINITION OF DONE

- [ ] `depositPolicyService.handleCancellation()` llamado en admin cancel
- [ ] Tests de integración escritos y pasando
- [ ] `pnpm test --run` verde
- [ ] `pnpm typecheck` sin errores
- [ ] API-001 actualizado con el contrato real
- [ ] PR mergeado a develop
