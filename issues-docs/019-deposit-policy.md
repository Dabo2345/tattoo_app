# ISSUE DOC — #019: DepositPolicy — lógica de cancelación y reembolso

## CONTEXTO
Tras confirmar una cita y cobrar el depósito, el cliente puede cancelar.
La política de reembolso depende del tiempo restante hasta la cita:
- 4+ días antes → reembolso automático vía Stripe
- <4 días antes → el depósito se retiene

## OBJETIVO
Implementar `depositPolicyService` con la lógica de cancelación/reembolso,
desacoplada del resto del sistema.

## SCOPE
- `src/modules/payment/services/deposit-policy.ts` — servicio principal
- `src/modules/payment/repositories/payment-repository.ts` — método `createRefundRecord`
- `tests/unit/modules/payment/deposit-policy.test.ts` — tests unitarios

## ANTI-SCOPE
- No implementar endpoint de cancelación (issue futura)
- No enviar email de cancelación (NOTIF-001)
- No modificar el estado del Appointment (lo hace quien llame a este servicio)

## ARCHIVOS AFECTADOS
- `src/modules/payment/services/deposit-policy.ts` (nuevo)
- `src/modules/payment/repositories/payment-repository.ts` (ampliar)
- `tests/unit/modules/payment/deposit-policy.test.ts` (nuevo)

## FLUJO DE EJECUCIÓN
1. Recibir `appointmentId` y `startsAt` de la cita
2. Calcular días completos entre ahora y `startsAt`
3. Si ≥ 4 días → llamar a Stripe Refunds API → guardar Refund en DB → AuditLog
4. Si < 4 días → solo AuditLog con motivo de retención
5. Devolver `{ refunded: boolean, stripeRefundId?: string }`

## REGLAS DE NEGOCIO
- RB-013: cancelación con ≥4 días → reembolso automático
- RB-014: cancelación con <4 días → retención del depósito
- RB-015: reprogramar con <4 días equivale a cancelar

## CRITERIOS DE ACEPTACIÓN
- [ ] ≥4 días → reembolso Stripe + Payment REFUNDED + Refund record
- [ ] <4 días → sin reembolso, solo AuditLog
- [ ] Exactamente 4 días → reembolso (límite inclusivo)
- [ ] Stripe falla → RefundFailedError + Sentry
- [ ] AuditLog registra la acción en todos los casos

## TESTS REQUERIDOS
- ≥4 días → llama a Stripe + guarda Refund
- <4 días → no llama a Stripe
- Exactamente 4 días → reembolso
- mismo día (0 días) → retención
- Stripe falla → RefundFailedError

## DEPENDENCIAS
- #18 ✅ — Payment en DB con stripePaymentIntentId poblado

## DEFINITION OF DONE
- [ ] depositPolicyService implementado
- [ ] paymentRepository ampliado
- [ ] Tests pasando
- [ ] CI verde
