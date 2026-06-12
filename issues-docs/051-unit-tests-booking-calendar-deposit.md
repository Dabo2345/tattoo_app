# ISSUE DOC #051 — Unit tests: BookingService, CalendarService y DepositPolicy

## CONTEXTO

Los módulos críticos de negocio tienen tests parciales. `bookTattooSession` (BookingService) no tiene ningún test. CalendarService y DepositPolicy tienen algunos edge cases sin cubrir. Esta issue completa la cobertura al 100% en los tres módulos, requerido por TEST-001 para los módulos de booking/payments.

## OBJETIVO

Añadir los tests unitarios faltantes en los tres archivos existentes:
- `bookTattooSession` completo (BookingService) — 0 tests actualmente
- Edge cases de CalendarService: >60 días, assertSlotAvailable con BlockedPeriod
- Edge cases de DepositPolicy: payment no encontrado, escenario de reprogramación (RB-015)

## SCOPE

- `tests/unit/modules/booking/booking-service.test.ts` ← MODIFIED (añade describe bookTattooSession)
- `tests/unit/modules/calendar/calendar-service.test.ts` ← MODIFIED (añade edge cases)
- `tests/unit/modules/payment/deposit-policy.test.ts` ← MODIFIED (añade edge cases)

## ANTI-SCOPE

- No modificar el código de producción
- No crear nuevos archivos de test (solo añadir a los existentes)
- No tests de integración (eso es #052)

## ARCHIVOS AFECTADOS

```
issues-docs/051-unit-tests-booking-calendar-deposit.md              ← NEW
tests/unit/modules/booking/booking-service.test.ts                  ← MODIFIED
tests/unit/modules/calendar/calendar-service.test.ts                ← MODIFIED
tests/unit/modules/payment/deposit-policy.test.ts                   ← MODIFIED
```

## TESTS REQUERIDOS

### BookingService.bookTattooSession (nuevo)
| Test | Descripción |
|------|-------------|
| happy path | Crea TattooSession, marca link usado, llama notificationService, devuelve appointmentId |
| link no encontrado | Lanza LinkNotFoundError si findSessionLinkWithAppointment devuelve null |
| link expirado | Lanza LinkExpiredError si expiresAt < now |
| link ya usado | Lanza LinkAlreadyUsedError si usedAt !== null |
| slot ocupado | Lanza SlotNotAvailableError si assertSlotAvailable lanza |
| no crea appointment si slot ocupado | Verifica que createTattooSession no se llama si assertSlotAvailable falla |
| audit log | Crea AuditLog con action TATTOO_SESSION_BOOKED |

### CalendarService (edge cases)
| Test | Descripción |
|------|-------------|
| getAvailableSlots >60 días | Rango > MAX_DAYS_AHEAD se trunca — devuelve slots solo dentro del límite |
| assertSlotAvailable con BlockedPeriod | Lanza SlotNotAvailableError si hay BlockedPeriod solapado |

### DepositPolicy (edge cases)
| Test | Descripción |
|------|-------------|
| payment no encontrado | handleCancellation lanza PaymentFailedError si no hay Payment en DB |
| reprogramación <4 días | RB-015: misma lógica que cancelación tardía → retiene depósito |

## DEPENDENCIAS

- #015 — BookingService.createConsultation ✅
- #027 — bookTattooSession ✅
- #049 — NotificationService (sendSessionConfirmed integrado en bookTattooSession) ✅

## DEFINITION OF DONE

- [ ] `describe("bookingService.bookTattooSession")` con 7+ tests
- [ ] 2 edge cases añadidos a CalendarService
- [ ] 2 edge cases añadidos a DepositPolicy
- [ ] `pnpm test` verde en los 3 archivos
- [ ] TypeScript sin errores
