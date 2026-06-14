# ISSUE DOC — #046 Setup Resend: cliente, módulo y estructura de notificaciones

## 1. CONTEXTO

El sistema de notificaciones por email es un requisito funcional crítico (NP-001). Resend es el proveedor oficial (NP-002). Antes de implementar los templates (#047, #048) y el servicio de orquestación (#049), se necesita la infraestructura base: el cliente Resend, la función de envío centralizada, los tipos del módulo, el repositorio y los errores.

## 2. OBJETIVO

Crear la infraestructura completa del módulo de notificaciones:
- Cliente Resend singleton
- Helper `sendEmail` con manejo de errores (NP-003, NP-005)
- Tipos del módulo (`NotificationPayload`, etc.)
- Repositorio para CRUD de `Notification` en DB
- Errores del módulo
- Componente de layout base para templates React Email

## 3. SCOPE

- `src/lib/resend/client.ts` — singleton Resend
- `src/lib/resend/send-email.ts` — helper centralizado de envío
- `src/modules/notification/types/index.ts` — tipos e interfaces
- `src/modules/notification/repositories/notification-repository.ts` — CRUD DB
- `src/modules/notification/errors.ts` — errores del módulo
- `src/modules/notification/templates/base-layout.tsx` — layout base React Email
- `tests/unit/lib/resend/send-email.test.ts` — tests del helper

## 4. ANTI-SCOPE

- No crear templates concretos (#047, #048)
- No crear NotificationService (#049)
- No crear reminder scheduler (#050)
- No enviar emails reales (mock en tests)

## 5. ARCHIVOS AFECTADOS

```
src/lib/resend/client.ts                          (nuevo)
src/lib/resend/send-email.ts                       (nuevo)
src/modules/notification/types/index.ts            (nuevo)
src/modules/notification/repositories/notification-repository.ts (nuevo)
src/modules/notification/errors.ts                 (nuevo)
src/modules/notification/templates/base-layout.tsx (nuevo)
tests/unit/lib/resend/send-email.test.ts           (nuevo)
package.json + pnpm-lock.yaml                      (añadir resend + @react-email/components)
```

## 6. REGLAS DE NEGOCIO

- NP-002: Resend es el único proveedor autorizado
- NP-003: Los errores de envío se loguean y registran en DB; nunca rompen el flujo
- NP-005: El envío es asíncrono y no bloquea la respuesta al cliente

## 7. CRITERIOS DE ACEPTACIÓN

- [ ] `resend` y `@react-email/components` instalados
- [ ] Cliente Resend inicializado con `env.RESEND_API_KEY`
- [ ] `sendEmail` retorna `{ success: true }` o `{ success: false, error }` (nunca lanza)
- [ ] `sendEmail` usa `env.RESEND_FROM_EMAIL` y `env.RESEND_FROM_NAME` para el remitente
- [ ] `NotificationRepository` tiene `create`, `markSent`, `markFailed`
- [ ] Layout base React Email renderiza HTML válido
- [ ] Tests pasan con Resend mockeado

## 8. TESTS REQUERIDOS

- `sendEmail` retorna `{ success: true }` con mock OK
- `sendEmail` retorna `{ success: false, error }` si Resend lanza
- `sendEmail` nunca lanza excepción (NP-003)

## 9. DEPENDENCIAS

- #011 (API helpers) ✅
- `resend` npm package
- `@react-email/components` npm package

## 10. DEFINITION OF DONE

- [ ] Código implementado según SCOPE
- [ ] Tests unitarios passing
- [ ] TypeScript sin errores
- [ ] ESLint limpio
- [ ] PR creado
