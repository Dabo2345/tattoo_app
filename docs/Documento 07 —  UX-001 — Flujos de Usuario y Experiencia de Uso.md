# UX-001 — Flujos de Usuario y Experiencia de Uso

## Estado

Aprobado

## Versión

1.0

---

# 1. Objetivo

Definir los recorridos completos de usuario.

Todos los flujos descritos aquí serán considerados comportamiento oficial del sistema.

---

# 2. Tipos de Usuario

## Visitor

Persona que navega por la web.

No ha reservado ninguna cita.

---

## Client

Persona que ha realizado una reserva.

No posee cuenta.

---

## Artist

Administrador autenticado.

---

# 3. Mapa de Navegación Pública

/

↓

Inicio

↓

Perfil Artista

↓

Galería

↓

Información Estudio

↓

Reservar Consulta

---

Rutas públicas

/

/perfil

/galeria

/estudio

/reservar

/session-link/[token]

/magic-link/[token]

---

# 4. Flujo Principal de Reserva

Visitor

↓

Página Reservar

↓

Selecciona Slot

↓

Introduce datos

↓

Stripe Checkout

↓

Pago exitoso

↓

Consulta confirmada

↓

Email confirmación

↓

MagicLink enviado

---

# 5. Flujo de Pago Fallido

Visitor

↓

Stripe

↓

Pago cancelado o fallido

↓

Appointment

PENDING_PAYMENT

↓

15 minutos

↓

EXPIRED

↓

Slot liberado

---

Pantalla mostrada

"No se ha podido completar el pago."

Botones:

Intentar nuevamente

Volver al calendario

---

# 6. Flujo SessionLink

Artist

↓

Consulta completada

↓

Generar SessionLink

↓

Email enviado

↓

Cliente abre enlace

↓

Selecciona fecha

↓

Reserva TattooSession

↓

Confirmación enviada

---

# 7. Flujo MagicLink

Cliente recibe email

↓

Abre MagicLink

↓

Visualiza cita

↓

Opciones:

Reprogramar

Cancelar

---

Si expira:

↓

Mensaje de expiración

↓

Solicitar nuevo enlace

---

# 8. Flujo Cancelación

Cliente

↓

MagicLink

↓

Cancelar cita

↓

Evaluación política depósito

↓

Resultado

Reembolso

o

Depósito retenido

↓

Email informativo

---

# 9. Flujo Reprogramación

Cliente

↓

MagicLink

↓

Reprogramar

↓

Ver slots disponibles

↓

Seleccionar nuevo slot

↓

Confirmar

↓

Email actualizado

---

# 10. Flujo Login Admin

Artist

↓

/admin/login

↓

Email

↓

Contraseña

↓

Validación

↓

Dashboard

---

# 11. Dashboard Admin

Accesos principales

Agenda

Citas

Galería

Contenido

Configuración

---

# 12. Gestión Agenda

Artist

↓

Calendario semanal

↓

Seleccionar cita

↓

Ver detalles

↓

Cancelar

o

Reprogramar

---

# 13. Crear Plan de Tatuaje (Admin)

Disponible en el detalle de una cita de tipo CONSULTATION en estado CONFIRMED.

## Flujo sin plan previo

Artist

↓

Selecciona cita CONSULTATION + CONFIRMED en el calendario semanal

↓

Hace click en "Plan de tatuaje"

↓

Se carga el plan desde `/api/admin/appointments/:id/tattoo-plan`

↓

Si no existe plan (404): muestra `TattooPlanForm`

↓

Rellena: estilo, tamaño, placement, descripción, notas (opcional), sesiones (mín. 1, máx. 10)

↓

Click "Guardar plan" → `POST /api/admin/appointments/:id/tattoo-plan`

↓

Si éxito: se muestra `TattooPlanStatus` con el plan en estado DRAFT

↓

Click "Enviar al cliente" → `POST /api/admin/tattoo-plans/:planId/send`

↓

El plan pasa a SENT. Cada sesión genera un SessionLink. Se dispara email al cliente (stub hasta #073).

---

## Flujo con plan existente

Si ya existe un plan al hacer click en "Plan de tatuaje":

- Si DRAFT → muestra `TattooPlanStatus` con botón "Enviar al cliente"
- Si SENT / IN_PROGRESS / COMPLETED → muestra `TattooPlanStatus` en solo lectura

---

## Reglas de visibilidad

- El botón "Plan de tatuaje" solo aparece para citas CONSULTATION + CONFIRMED
- Un plan SENT no puede editarse desde la UI (solo lectura)

---

# 14. Gestión Galería

Artist

↓

Galería

↓

Subir imagen

↓

Asignar StyleTags

↓

Guardar

↓

Visible públicamente

---

# 14. Gestión Contenido

Artist

↓

Perfil

↓

Editar

↓

Guardar

↓

Reflejado públicamente

---

# 15. Estados de Carga

Toda operación deberá mostrar:

Loading

Success

Error

---

Nunca dejar elementos sin feedback visual.

---

# 16. Estados Vacíos

Galería vacía

Sin citas

Sin resultados filtro

Sin imágenes

---

Todos los estados vacíos tendrán mensaje explicativo.

---

# 17. Estados de Error

Error de red

Error servidor

Error validación

Error pago

Error expiración enlace

---

Cada error deberá ofrecer acción de recuperación.

---

# 18. Responsive

Mobile First obligatorio.

---

Breakpoints mínimos

Mobile

Tablet

Desktop

---

# 19. Accesibilidad

Cumplimiento WCAG AA.

---

Soporte:

Teclado

Focus visible

Lectores pantalla

Contraste suficiente

---

# 20. Principios UX

Menor número de clics posible.

Claridad antes que complejidad.

Feedback inmediato.

No exigir conocimientos técnicos al cliente.

No exigir registro de cuenta.
