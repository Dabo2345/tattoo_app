# ISSUE DOC #034 — Flujo completo de reserva (/reservar)

## CONTEXTO

La ruta `/reservar` tiene un placeholder. Esta issue construye el flujo de reserva de consulta
completo en 3 pasos: selección de fecha → selección de slot → formulario de cliente + pago.

**Nota sobre dependencias no mergeadas:** #029 (CalendarPublic/SlotPicker) y #016/017 (API)
no están en main todavía. El wizard usa `<input type="date">` nativo para la fecha y fetch
directo para slots. Cuando #029 y #016/#017 mergeen, se puede upgradar el UI y el endpoint.

---

## OBJETIVO

1. **`BookingWizard`** — client component con 3 pasos:
   - Paso 1: Selección de fecha con `<input type="date">`
   - Paso 2: Fetch de slots desde `/api/availability` y selección
   - Paso 3: Formulario (nombre, email, teléfono, descripción) validado con Zod

2. **`/reservar`** — página que envuelve el wizard

3. Submit → `POST /api/consultations` → redirect a `stripeCheckoutUrl`

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/modules/booking/schemas/consultation-schema.ts` | Crear — Zod schema |
| `src/modules/booking/components/booking-wizard.tsx` | Crear — wizard client component |
| `src/app/(public)/reservar/page.tsx` | Modificar — reemplaza placeholder |
| `tests/unit/modules/booking/booking-wizard.test.tsx` | Crear — tests |

---

## ANTI-SCOPE

- NO implementar CalendarPublic ni SlotPicker (son de #029)
- NO implementar `POST /api/consultations` (es de #016)
- NO implementar Stripe session (es de #017)
- NO react-hook-form (usar Zod + useState controlado)
- NO instalar nuevas dependencias (@tanstack/react-query está en STD-001 pero se instala en #029)

---

## FLUJO DE EJECUCIÓN

1. Crear Zod schema de consulta
2. Crear BookingWizard con máquina de estado: date → slot → form → submitting → error
3. Actualizar página `/reservar`
4. Tests: render, validación, submit
5. Commit + push + PR

---

## REGLAS DE NEGOCIO (DATA-002 / API-001)

- Consultation body: `{ name, email, phone, tattooDescription }`
- Respuesta 201: `{ appointmentId, stripeCheckoutUrl }`
- En caso de éxito → `window.location.href = stripeCheckoutUrl`
- En caso de error → mostrar mensaje, permitir reintentar
- Feedback visual obligatorio en cada estado (loading, error, success)

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Paso 1: fecha seleccionable con input date
- [ ] Paso 2: fetch slots desde `/api/availability`, muestra grid o mensaje vacío
- [ ] Paso 3: formulario con 4 campos, validación Zod inline
- [ ] Submit deshabilitado si formulario inválido
- [ ] Estado loading durante submit
- [ ] Error mostrado si POST falla
- [ ] Página tiene metadata title "Reservar Consulta"
- [ ] Todos los tests pasan

---

## TESTS REQUERIDOS

### Unit (`tests/unit/modules/booking/booking-wizard.test.tsx`, happy-dom)
- Renderiza el paso 1 (date selection) por defecto
- "Siguiente" deshabilitado sin fecha seleccionada
- Con fecha seleccionada el paso 2 se muestra (mock fetch slots)
- Paso 3 muestra campos del formulario
- Submit muestra errores de validación si campos vacíos
- Submit con datos válidos llama a POST /api/consultations

---

## DEPENDENCIAS

- #028 (Button disponible en main)
- Zod disponible en main
- #029, #016, #017 — referenciados pero no requeridos en main para esta PR

---

## DEFINITION OF DONE

- [ ] Archivos creados/modificados
- [ ] Tests pasando
- [ ] Suite verde
- [ ] PR creado
