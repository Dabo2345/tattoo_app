# TEST-001 — Estrategia de Testing y Calidad

## Estado

Aprobado

## Versión

1.0

## Fecha

2026-06-05

---

# 1. Objetivo

Garantizar que cualquier cambio en el sistema:

* no rompa funcionalidades existentes
* sea verificable automáticamente
* sea reproducible en CI/CD
* pueda ser validado antes de merge

---

# 2. Filosofía de Testing

## Regla base

> Ningún código entra a main sin pasar validación automática.

---

## Principios

* Testing obligatorio en features críticas
* Tests como contrato del sistema
* Fallo de test = bloqueo de PR
* No se permite “deploy confiando”

---

# 3. Pirámide de Testing

## 1. Unit Tests (70%)

* lógica pura
* utils
* validaciones Zod
* reglas de negocio

---

## 2. Integration Tests (20%)

* API + DB
* booking engine
* stripe flow
* magic links

---

## 3. E2E Tests (10%)

* flujos completos usuario
* reserva
* cancelación
* admin panel

---

# 4. Stack de Testing

* Vitest → unit/integration
* Playwright → E2E
* Testing Library → UI
* MSW → API mocking

---

# 5. Cobertura mínima

## Requerido

* 80% global mínimo
* 100% en:

  * booking engine
  * payments
  * auth
  * magic links

---

# 6. Qué se debe testear

## Obligatorio

* creación de consultas
* validación slots
* stripe checkout
* cancelación + refund policy
* generación MagicLink
* generación SessionLink
* admin actions

---

# 7. Qué NO se testea

* estilos UI
* animaciones
* layout visual
* copywriting

---

# 8. Testing de API

Cada endpoint debe tener:

* success case
* error case
* edge case

---

# 9. Testing de Booking Engine

Casos obligatorios:

* slot ocupado
* slot libre
* solapamiento
* bloqueo horario
* cambio timezone
* cancelación < 4 días
* cancelación > 4 días

---

# 10. Testing de Stripe

* pago exitoso
* pago fallido
* webhook válido
* webhook inválido
* refund automático

---

# 11. Testing de MagicLink

* válido
* expirado
* multiuso dentro de ventana
* token inválido

---

# 12. E2E Flows críticos

## Flujo 1

Reserva completa:

Home → Booking → Stripe → Confirmación → Email

---

## Flujo 2

Cancelación:

MagicLink → Cancel → Policy → Refund

---

## Flujo 3

Admin:

Login → Crear SessionLink → Enviar → Cliente reserva

---

# 13. Mocking

MSW obligatorio para:

* Stripe
* WhatsApp/email providers
* APIs externas

---

# 14. CI Integration

Tests ejecutan:

* en cada PR
* en merge a develop
* en release

---

# 15. Fail Policy

Si un test falla:

* PR bloqueado
* no deploy
* rollback automático si estaba en staging

---

# 16. Golden Rule

> Si no está testeado, no existe.
