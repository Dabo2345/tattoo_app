# ISSUE DOC #057 — Bugfix: refundAmount con fallback hardcodeado a 50

## CONTEXTO

En la ruta de cancelación del cliente, la respuesta calcula el importe reembolsado como:

```typescript
// src/app/api/appointments/[id]/cancel/route.ts:80
refundAmount: policyResult.refunded ? Number(appointment.depositAmount ?? 50) : 0
```

Si `appointment.depositAmount` es `null` en DB (el campo es nullable en el schema), la API responde que el reembolso fue de **50€** aunque el importe real en Stripe puede ser diferente.

**Root cause**: `depositAmount` en `Appointment` es un campo calculado/redundante. El importe real del pago está en `Payment.amount`. Se usó como shortcut en lugar de consultar el Payment record.

**Impacto**: 
- No afecta al reembolso real (depositPolicyService usa `Payment.amount` para el refund en Stripe)
- El cliente ve en la respuesta de la API un importe incorrecto
- Puede generar confusión o disputas si el cliente ve "50€ reembolsado" cuando en realidad fue 35€ o 75€

## OBJETIVO

Obtener el `refundAmount` del resultado real de `depositPolicyService.handleCancellation()` o del Payment record, eliminando el fallback hardcodeado.

## SCOPE

- `src/app/api/appointments/[id]/cancel/route.ts` — corregir el cálculo de `refundAmount`

## ANTI-SCOPE

- No modificar el schema de DB
- No modificar depositPolicyService

## ARCHIVOS AFECTADOS

```
src/app/api/appointments/[id]/cancel/route.ts   ← MODIFIED
issues-docs/057-bugfix-refund-amount-hardcoded.md ← NEW
```

## ANÁLISIS TÉCNICO

`depositPolicyService.handleCancellation()` devuelve:
```typescript
type DepositPolicyResult =
  | { refunded: true; stripeRefundId: string }
  | { refunded: false; reason: "too_late" }
```

No devuelve el `amount`. Para obtenerlo hay dos opciones:

**Opción A** (recomendada): Consultar el Payment record cuando hay reembolso
```typescript
if (policyResult.refunded) {
  const payment = await paymentRepository.findByAppointmentId(appointmentId)
  refundAmount = payment ? Number(payment.amount) : 0
}
```

**Opción B**: Modificar `DepositPolicyResult` para incluir el amount reembolsado — más cambio de código, impacto en tests.

Usar **Opción A** — mínimo cambio, sin modificar la interfaz del servicio.

## FLUJO DE EJECUCIÓN

1. Importar `paymentRepository`
2. Después de `depositPolicyService.handleCancellation()`, si `policyResult.refunded`:
   - Consultar `paymentRepository.findByAppointmentId(appointmentId)`
   - Usar `Number(payment?.amount ?? 0)` como `refundAmount`
3. Si no hay reembolso: `refundAmount = 0`
4. Construir la respuesta con el valor correcto

## CRITERIOS DE ACEPTACIÓN

- [ ] Si hay reembolso, `refundAmount` refleja el importe real del Payment record
- [ ] Si no hay Payment en DB, `refundAmount` es 0 (no 50)
- [ ] El comportamiento de la cancelación no cambia, solo la respuesta de la API
- [ ] Tests actualizados para verificar el importe correcto

## TESTS REQUERIDOS

En el test de integración de cancel:
- Verificar que `refundAmount` en la respuesta coincide con `payment.amount` del mock
- Verificar que si no hay payment, `refundAmount` es 0

## DOCUMENTACIÓN AFECTADA

- `docs/Documento 05 — API-001 ...` → Actualizar el contrato de respuesta de `POST /api/appointments/:id/cancel` para documentar que `refundAmount` viene del Payment record

## DEPENDENCIAS

- #053 debe hacerse primero (la ruta admin cancel tendrá el mismo patrón)

## DEFINITION OF DONE

- [ ] Fallback hardcodeado eliminado
- [ ] `refundAmount` obtenido del Payment record
- [ ] Tests actualizados
- [ ] `pnpm test --run` verde
- [ ] `pnpm typecheck` sin errores
- [ ] PR mergeado a develop
