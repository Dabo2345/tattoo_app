# ISSUE DOC #047 — Templates React Email: consultation-confirmed y session-confirmed

## CONTEXTO

Issue #046 estableció la infraestructura base del módulo de notificaciones: cliente Resend, función `sendEmail`, tipos de payload, repositorio y el `BaseLayout` compartido para emails.

Esta issue implementa los dos primeros templates de React Email: el email de confirmación de consulta (con MagicLink) y el de confirmación de sesión de tatuaje (via SessionLink).

## OBJETIVO

Crear dos templates React Email funcionales y testeados:
- `consultation-confirmed.tsx` — Email enviado al cliente tras pago exitoso de depósito de consulta
- `session-confirmed.tsx` — Email enviado al cliente tras reservar una sesión de tatuaje via SessionLink

## SCOPE

- `src/modules/notification/templates/consultation-confirmed.tsx`
- `src/modules/notification/templates/session-confirmed.tsx`
- `tests/unit/modules/notification/consultation-confirmed.test.tsx`
- `tests/unit/modules/notification/session-confirmed.test.tsx`

## ANTI-SCOPE

- No implementar `NotificationService` (eso es #049)
- No crear otros templates (cancelled, rescheduled, magic-link, session-link, reminders — eso es #048/#050)
- No integrar con Stripe webhook ni BookingService

## ARCHIVOS AFECTADOS

```
src/modules/notification/templates/consultation-confirmed.tsx   ← NEW
src/modules/notification/templates/session-confirmed.tsx         ← NEW
tests/unit/modules/notification/consultation-confirmed.test.tsx ← NEW
tests/unit/modules/notification/session-confirmed.test.tsx       ← NEW
```

## FLUJO DE EJECUCIÓN

1. Crear `consultation-confirmed.tsx` con los datos requeridos por NOTIF-001 §6.2
2. Crear `session-confirmed.tsx` con los datos requeridos por NOTIF-001 §6.2
3. Ambos usan `BaseLayout` como envolvente
4. Escribir tests que renderizan los templates y verifican su contenido
5. Verificar typecheck, lint y tests verdes

## REGLAS DE NEGOCIO

- Según NOTIF-001 §6.2:
  - `consultation-confirmed`: Nombre cliente, fecha/hora, depósito pagado, MagicLink para gestionar
  - `session-confirmed`: Nombre cliente, fecha/hora sesión, duración estimada, dirección estudio
- Según NOTIF-001 §6.4: HTML + texto plano, tema oscuro, accent rojo #B91C1C, botón CTA claro

## CRITERIOS DE ACEPTACIÓN

- [ ] `ConsultationConfirmedEmail` acepta `ConsultationConfirmedPayload` y renderiza HTML con todos los datos
- [ ] `SessionConfirmedEmail` acepta `SessionConfirmedPayload` y renderiza HTML con todos los datos
- [ ] Ambos templates usan `BaseLayout`
- [ ] Botón CTA en `consultation-confirmed` lleva al MagicLink
- [ ] Diseño alineado con UI-001 (fondo oscuro, accent #B91C1C)
- [ ] Tests verifican presencia de datos clave en el HTML renderizado

## EDGE CASES

- `artistNotes` en `SessionConfirmedPayload` es opcional — si no se proporciona no aparece sección
- Duración de sesión en horas+minutos (60min → "1h", 90min → "1h 30min", 30min → "30 min")

## TESTS REQUERIDOS

| Test | Tipo | Descripción |
|------|------|-------------|
| consultation-confirmed renderiza nombre | Unit | El HTML contiene el nombre del cliente |
| consultation-confirmed renderiza fecha | Unit | El HTML contiene la fecha formateada |
| consultation-confirmed contiene MagicLink | Unit | El href del botón es el magicLinkUrl |
| consultation-confirmed muestra depósito | Unit | El HTML contiene el monto del depósito |
| session-confirmed renderiza nombre | Unit | El HTML contiene el nombre del cliente |
| session-confirmed renderiza duración | Unit | El HTML contiene la duración formateada |
| session-confirmed sin notas no muestra sección | Unit | Si artistNotes es undefined no hay sección de notas |
| session-confirmed con notas la muestra | Unit | Si artistNotes está presente aparece en el HTML |

## DEPENDENCIAS

- #046 — Setup Resend: cliente, módulo y estructura de plantillas ✅

## DEFINITION OF DONE

- [ ] Ambos templates implementados en `/src/modules/notification/templates/`
- [ ] Tests unitarios escritos y pasando (8+ tests entre los dos archivos)
- [ ] TypeScript sin errores
- [ ] ESLint sin errores
- [ ] CI verde (pnpm typecheck + pnpm lint + pnpm test)
