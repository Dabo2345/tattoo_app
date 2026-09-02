# ISSUE #166 — Security: rate limiting en webhook de Stripe

---

# 1. CONTEXTO

El endpoint `POST /api/webhooks/stripe` no tiene rate limiting específico.
Un atacante que conozca la URL puede enviar cientos de peticiones con firmas inválidas, forzando al servidor a ejecutar la verificación HMAC-SHA256 en cada una.

Aunque `stripe.webhooks.constructEvent` rechaza peticiones inválidas con 400 antes de cualquier acceso a BD, el coste de CPU por verificación HMAC acumulado puede degradar el servicio bajo un flood sostenido.

La verificación de firma ya es la protección principal contra inyección de eventos falsos. El rate limiting es la capa de defensa adicional contra flooding.

---

# 2. OBJETIVO

Implementar un rate limiter in-memory por IP en el endpoint `POST /api/webhooks/stripe` que:

- Rechace con **429 Too Many Requests** cuando una IP supere **60 peticiones por minuto**
- Registre en el logger las IPs bloqueadas
- No afecte el flujo normal de Stripe (Stripe envía un webhook por evento, no en ráfaga)

---

# 3. ALCANCE (SCOPE)

- Crear `src/lib/api/rate-limiter.ts` — utilidad genérica de rate limiting in-memory
- Modificar `src/app/api/webhooks/stripe/route.ts` — aplicar rate limiter antes de la verificación de firma
- Añadir tests al archivo existente `tests/integration/api/stripe-webhook.test.ts`

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

- No implementar Redis/Upstash ni ninguna dependencia externa nueva
- No aplicar rate limiting a otras rutas (issue separada si se requiere)
- No modificar la lógica de verificación de firma ni el procesamiento de eventos
- No usar Next.js middleware global
- No implementar allowlist de IPs de Stripe

---

# 5. ARCHIVOS AFECTADOS

**Código:**
- `src/lib/api/rate-limiter.ts` (nuevo)
- `src/app/api/webhooks/stripe/route.ts` (modificar)
- `tests/integration/api/stripe-webhook.test.ts` (modificar)

**Docs:**
- `docs/Documento 06 — AUTH-001 — Autenticación, Autorización y Seguridad.md` (sección de seguridad de webhooks)

---

# 6. FLUJO DE EJECUCIÓN

1. Crear `src/lib/api/rate-limiter.ts` con clase `InMemoryRateLimiter`
2. Modificar `route.ts` del webhook para extraer IP y aplicar rate limiter antes de la verificación de firma
3. Si rate limit superado → log + return 429
4. Añadir tests de rate limiting en el archivo de test existente
5. Verificar que tests existentes siguen pasando

---

# 7. REGLAS DE NEGOCIO

- Límite: **60 peticiones por minuto por IP**
- Ventana: sliding window de 60 segundos
- IP extraída de `x-forwarded-for` o `x-real-ip` headers, con fallback a `"unknown"`
- Respuesta 429: `{ error: "Too many requests" }`
- La limpieza de entradas expiradas se hace en cada llamada (lazy cleanup) para evitar memory leaks

---

# 8. CRITERIOS DE ACEPTACIÓN

- [ ] Peticiones por debajo del límite pasan normalmente
- [ ] Petición 61 de la misma IP en la misma ventana devuelve 429
- [ ] Las IPs bloqueadas se loguean con `logger.warn`
- [ ] El rate limiter no bloquea la IP de Stripe en condiciones normales (< 60 webhooks/min)
- [ ] Los tests existentes del webhook siguen pasando sin modificación
- [ ] CI verde

---

# 9. CASOS EDGE

- **IP desconocida** (`x-forwarded-for` ausente): usar clave `"unknown"`, aplicar el mismo límite
- **Múltiples IPs en `x-forwarded-for`**: usar la primera (la del cliente original)
- **Entradas expiradas en el Map**: limpiar en cada acceso para evitar memory leak
- **Rate limiter no bloquea a Stripe en condiciones normales**: Stripe envía máximo 1 webhook por evento, no en ráfaga

---

# 10. TESTS REQUERIDOS

En `tests/integration/api/stripe-webhook.test.ts`:
- Test: petición bloqueada devuelve 429 cuando se supera el límite
- Test: petición sin signature devuelve 400 (no 429) si está dentro del límite
- (Los tests existentes no se modifican, solo se añaden nuevos)

---

# 11. DEPENDENCIAS

- Ninguna. Todas las issues previas están cerradas.

---

# 12. DOCUMENTACIÓN AFECTADA

- `docs/Documento 06 — AUTH-001 — Autenticación, Autorización y Seguridad.md` — añadir sección sobre rate limiting en webhook de Stripe

---

# 13. DEFINITION OF DONE

- [ ] `src/lib/api/rate-limiter.ts` creado
- [ ] `src/app/api/webhooks/stripe/route.ts` aplica rate limiter
- [ ] Tests de rate limiting añadidos y pasando
- [ ] Tests existentes no rotos
- [ ] `AUTH-001` actualizado
- [ ] CI verde
- [ ] PR creado apuntando a `develop`
