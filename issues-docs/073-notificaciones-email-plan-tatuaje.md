# ISSUE DOC #073 — Notificaciones: Email "plan de tatuaje enviado al cliente"

**Issue GitHub:** #073  
**Tipo:** feature  
**Epic:** EPIC 7 — Notifications  
**Rama:** `feature/073-notificaciones-email-plan-tatuaje`  
**Estado:** PENDIENTE  
**Fecha:** 2026-06-18  

---

## 1. CONTEXTO

Cuando el admin envía el plan de tatuaje al cliente (#070), el servicio llama a `notificationService.sendTattooPlan(planId)` — que en #070 se dejó como stub con `// TODO: #073`. Esta issue implementa el método real: el template de email y el envío vía Resend.

El email debe informar al cliente de las características del tatuaje acordado, listar las sesiones con sus duraciones y proporcionar los links de reserva individuales para cada sesión.

---

## 2. OBJETIVO

Implementar el template React Email `tattoo-plan.tsx` y el método `NotificationService.sendTattooPlan(planId)` para enviar al cliente un email completo con el plan de tatuaje y los links de reserva de cada sesión.

---

## 3. SCOPE

- Nuevo template React Email en `src/modules/notification/templates/tattoo-plan.tsx`
- Implementar `sendTattooPlan(planId)` en `NotificationService`
- Añadir tipo `TATTOO_PLAN_SENT` al enum `NotificationType` (si no existe) en el schema Prisma o en los tipos
- Crear registro `Notification` al enviar (para audit trail)
- Reemplazar el stub `// TODO: #073` en `TattooPlanService.sendPlanToClient`

---

## 4. ANTI-SCOPE

- NO modificar otros templates de email existentes
- NO cambiar el sistema de Resend ni la función `sendEmail`
- NO modificar el schema de Prisma más allá de añadir el valor al enum `NotificationType` si es necesario
- NO implementar reintentos de email (el sistema existente ya tiene lógica de retry/status)
- NO añadir internacionalización (el email es en español)

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/modules/notification/templates/tattoo-plan.tsx` — nuevo template React Email
- `src/modules/notification/services/notification-service.ts` — añadir `sendTattooPlan(planId)`
- `src/modules/booking/services/tattoo-plan-service.ts` — reemplazar stub con llamada real
- `prisma/schema.prisma` — añadir `TATTOO_PLAN_SENT` al enum `NotificationType` (si no está ya)
- Si se modifica schema: nueva migración en `prisma/migrations/`

### Tests
- `tests/unit/notification-service.test.ts` — añadir test de `sendTattooPlan`

### Docs
- `docs/Documento 16 — NOTIF-001 — Sistema de Notificaciones.md`

---

## 6. FLUJO DE EJECUCIÓN

1. Leer `src/modules/notification/templates/` para entender la estructura y estilos de los templates existentes (mantener consistencia visual)
2. Leer `src/modules/notification/services/notification-service.ts` para entender el patrón de `sendConsultationConfirmed` y `sendSessionConfirmed`
3. Leer `prisma/schema.prisma` para verificar si existe `NotificationType` enum y si tiene `TATTOO_PLAN_SENT`
4. Si `TATTOO_PLAN_SENT` no existe en el enum:
   - Añadirlo al schema
   - Ejecutar `npx prisma migrate dev --name add_notification_type_tattoo_plan`
5. Crear `tattoo-plan.tsx` template con el siguiente contenido:

   **Estructura del email:**
   ```
   [Header del estudio — logo + nombre]
   
   "¡Tu plan de tatuaje está listo para reservar!"
   
   Hola [nombre del cliente],
   
   [Nombre del artista] ha preparado tu plan de tatuaje. 
   Aquí tienes todos los detalles:
   
   --- TUS CARACTERÍSTICAS DE TATUAJE ---
   Estilo: [style]
   Tamaño: [size]
   Placement: [placement]
   Descripción: [description]
   [Si hay notas]: Notas del artista: [notes]
   
   --- TUS SESIONES ---
   Para este tatuaje necesitarás [N] sesión(es):
   
   Sesión 1 — [X] horas
   [Enlace de reserva: botón "Reservar sesión 1"]
   Este enlace expira el [expiresAt formateado]
   
   Sesión 2 — [Y] horas
   [Enlace de reserva: botón "Reservar sesión 2"]
   Este enlace expira el [expiresAt formateado]
   
   [Footer estándar del estudio]
   ```

   Props del template:
   ```typescript
   interface TattooPlanEmailProps {
     clientName: string
     artistName: string
     studioName: string
     plan: {
       style: string
       size: string
       placement: string
       description: string
       notes?: string
     }
     sessions: Array<{
       sessionNumber: number
       durationMinutes: number
       bookingUrl: string  // URL completa del session link
       expiresAt: Date
     }>
   }
   ```

6. Implementar `sendTattooPlan(planId)` en `NotificationService`:
   - Obtener el plan completo con sesiones, sessionLinks y datos del cliente
   - Construir la URL de cada sesión: `${process.env.NEXT_PUBLIC_APP_URL}/session-link/${sessionLink.token}`
   - Formatear `expiresAt` de cada link en fecha legible (dd/MM/yyyy)
   - Llamar a `sendEmail` con el template `TattooPlanEmail`
   - Crear registro `Notification` con tipo `TATTOO_PLAN_SENT` y status `SENT` o `FAILED`

7. En `TattooPlanService.sendPlanToClient`, reemplazar:
   ```typescript
   // TODO: #073 - notificationService.sendTattooPlan(planId)
   ```
   por:
   ```typescript
   await notificationService.sendTattooPlan(planId)
   ```

8. Escribir tests
9. Actualizar docs

---

## 7. REGLAS DE NEGOCIO

- **RB-NOTIF-TP-001:** El email de plan de tatuaje se envía solo una vez, cuando el admin pulsa "Enviar al cliente".
- **RB-NOTIF-TP-002:** Si el envío falla (Resend error), se registra `Notification` con status `FAILED` y `errorMessage`. No se revierte el estado del plan (ya está SENT en DB; el error es solo del email).
- **RB-NOTIF-TP-003:** Cada sesión debe tener su propio link de reserva en el email. No se puede compartir un link entre sesiones.
- **RB-NOTIF-TP-004:** Las URLs de los SessionLinks deben ser absolutas (incluir dominio) para funcionar desde el email.
- **RB-NOTIF-TP-005:** La fecha de expiración de los links se muestra en formato legible (ej: "15 de julio de 2026").
- **RB-NOTIF-TP-006:** El email sigue el sistema de diseño del estudio (mismos colores, tipografía y estructura que los templates existentes).

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] `notificationService.sendTattooPlan(planId)` envía email al cliente del appointment
- [ ] El email contiene las características del tatuaje (estilo, tamaño, placement, descripción)
- [ ] El email contiene una sección por sesión con: duración y botón/link de reserva
- [ ] Los links de reserva son URLs absolutas válidas del tipo `/session-link/[token]`
- [ ] Se crea un registro `Notification` de tipo `TATTOO_PLAN_SENT`
- [ ] Si el envío falla, se registra status `FAILED` sin crashear el flujo
- [ ] El template es visualmente consistente con los templates existentes
- [ ] El stub `// TODO: #073` es reemplazado por la llamada real
- [ ] CI verde

---

## 9. EDGE CASES

- **Cliente sin email:** `notificationService` debe verificar que `client.email` existe antes de intentar el envío. Si no hay email, loggear warning y registrar `Notification` con status `FAILED` y mensaje descriptivo.
- **SessionLink sin token disponible:** El token es hashed en DB, nunca en plain text. Verificar cómo los templates existentes construyen URLs de session-links — seguir el mismo patrón (el token plain debe estar disponible en el momento de la creación, no después).
- **Plan con 1 sola sesión:** El email debe adaptarse: "Necesitarás 1 sesión" (singular) con un solo bloque de sesión.
- **Plan con muchas sesiones (ej: 8):** El email debe renderizar todas sin truncar. Probar el template con el caso de 8 sesiones.
- **Nombre de artista no configurado:** Si `artistName` no está disponible, usar un fallback genérico como el nombre del estudio.

---

## 10. TESTS REQUERIDOS

### Unitarios (`notification-service.test.ts`)
- `sendTattooPlan` con plan válido → llama a `sendEmail` con datos correctos del template
- `sendTattooPlan` → crea registro `Notification` con tipo `TATTOO_PLAN_SENT` y status `SENT`
- `sendTattooPlan` cuando `sendEmail` lanza error → crea `Notification` con status `FAILED`, no relanza error

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `NOTIF-001` | Tipos de notificación | Añadir `TATTOO_PLAN_SENT` con descripción, trigger y datos del email |
| `NOTIF-001` | Templates de email | Documentar `tattoo-plan.tsx` con props y estructura |

---

## 12. DEPENDENCIAS

- **#070 debe estar MERGEADA** — `TattooPlanService.sendPlanToClient` debe existir con el stub
- **#069 debe estar MERGEADA** — los modelos de plan deben existir para que `notificationService` pueda hacer la query

---

## 13. DEFINITION OF DONE

- [ ] Template `tattoo-plan.tsx` implementado con estructura completa
- [ ] `sendTattooPlan(planId)` implementado en `NotificationService`
- [ ] Stub `// TODO: #073` reemplazado en `TattooPlanService`
- [ ] Registro `Notification` creado en cada envío (SENT o FAILED)
- [ ] Tests unitarios pasan
- [ ] CI completamente verde
- [ ] `NOTIF-001` actualizado
- [ ] PR creado con descripción completa
- [ ] Probado manualmente: el email llega correctamente con links funcionales (en entorno de staging/local con Resend test mode)
