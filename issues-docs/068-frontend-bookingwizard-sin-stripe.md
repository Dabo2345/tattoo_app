# ISSUE DOC #068 — Frontend: BookingWizard sin redirect a Stripe

**Issue GitHub:** #068  
**Tipo:** refactor  
**Epic:** EPIC 5 — Client UI  
**Rama:** `refactor/068-frontend-bookingwizard-sin-stripe`  
**Estado:** PENDIENTE  
**Fecha:** 2026-06-18  

---

## 1. CONTEXTO

Tras el cambio backend de #067, la API `POST /api/consultations` ya no devuelve `checkoutUrl` sino `{ appointmentId, status: 'CONFIRMED' }`. El `BookingWizard` actualmente espera esa URL para redirigir al cliente a Stripe Checkout. Esa lógica debe eliminarse y reemplazarse por una pantalla de confirmación directa.

---

## 2. OBJETIVO

Actualizar el componente `BookingWizard` para que, tras el submit del formulario (paso 3), muestre un estado de confirmación inmediata en lugar de redirigir a Stripe. El flujo completo queda en 3 pasos: fecha → slot → formulario → **confirmación**.

---

## 3. SCOPE

- Eliminar toda referencia a `checkoutUrl` en `booking-wizard.tsx`
- Eliminar `router.push(checkoutUrl)` o `window.location.href = checkoutUrl`
- Añadir estado `confirmed` en el wizard que muestra la pantalla de confirmación
- La pantalla de confirmación debe mostrar: fecha y hora de la cita, nombre del cliente, mensaje de que recibirá email de confirmación
- Actualizar el indicador de pasos si hace falta (actualmente muestra 3 pasos)

---

## 4. ANTI-SCOPE

- NO modificar los pasos 1, 2 o 3 del wizard (fecha, slot, formulario)
- NO cambiar la validación del formulario ni los schemas Zod
- NO modificar `/api/consultations` ni ninguna lógica de backend
- NO añadir nuevas dependencias
- NO cambiar el diseño del wizard más allá de lo necesario para eliminar el pago

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/modules/booking/components/booking-wizard.tsx` — cambio principal: eliminar redirect, añadir estado `confirmed`
- `src/app/(public)/reservar/confirmacion/page.tsx` — si existe una página de confirmación post-Stripe, evaluar si sigue siendo necesaria o si puede redirigirse a la nueva confirmación inline

### Tests
- `tests/unit/booking-wizard.test.tsx` — actualizar: submit exitoso → estado `confirmed`, no redirect

---

## 6. FLUJO DE EJECUCIÓN

1. Leer `booking-wizard.tsx` completo
2. Localizar el handler `onSubmit` del paso 3 (ConsultationForm)
3. Localizar la lógica que usa `checkoutUrl` (probablemente `router.push` o `window.location`)
4. Reemplazar esa lógica: en lugar de redirect, setear estado `confirmed: true` con los datos del appointment
5. Añadir renderizado condicional: si `confirmed === true`, mostrar `<ConfirmationView>` con fecha/hora y mensaje de email
6. Leer `src/app/(public)/reservar/confirmacion/page.tsx` para ver si sigue siendo necesaria
7. Actualizar tests

---

## 7. REGLAS DE NEGOCIO

- **RB-NEW-001:** La confirmación de la consulta es inmediata. El cliente no necesita completar ningún pago.
- La pantalla de confirmación debe informar claramente que el cliente recibirá un email de confirmación.
- El wizard no debe redirigir fuera de `/reservar` al confirmar una consulta.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] Completar los 3 pasos del wizard muestra una pantalla de confirmación en la misma página
- [ ] La pantalla de confirmación muestra: fecha, hora y mensaje sobre el email
- [ ] No hay ningún redirect a Stripe ni a dominios externos
- [ ] No hay referencias a `checkoutUrl` en el componente
- [ ] El estado de error sigue funcionando si la API falla (muestra `submitError`)
- [ ] CI verde

---

## 9. EDGE CASES

- **API retorna error:** El wizard debe mostrar el error inline (comportamiento existente, sin cambios).
- **Usuario recarga la página tras confirmar:** El wizard vuelve al paso 1. Esto es comportamiento aceptado (no hay estado persistido en URL).
- **Página `/reservar/confirmacion`:** Si existe y era exclusiva para la confirmación post-Stripe, puede quedar como página huérfana o eliminarse. Evaluar en la implementación — no eliminar si tiene otros usos.

---

## 10. TESTS REQUERIDOS

### Unitarios
- Submit exitoso con datos válidos → renderiza vista de confirmación (no llama a `router.push` con URL externa)
- Submit con error de API → muestra `submitError`
- La vista de confirmación muestra la fecha y hora del appointment recibido

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `UX-001` | Flujo de reserva de consulta | Actualizar: paso 4 era "pago en Stripe", ahora es "confirmación directa" |
| `FRONT-001` | BookingWizard | Actualizar descripción de estados del componente |

---

## 12. DEPENDENCIAS

- **#067 debe estar MERGEADA** antes de implementar esta issue. El frontend depende de que la API ya no devuelva `checkoutUrl`.

---

## 13. DEFINITION OF DONE

- [ ] Código implementado según scope
- [ ] Tests actualizados y pasando
- [ ] CI completamente verde
- [ ] `UX-001` actualizado
- [ ] `FRONT-001` actualizado
- [ ] PR creado con descripción completa
- [ ] Probado manualmente: flujo completo de reserva sin pago funciona en local
