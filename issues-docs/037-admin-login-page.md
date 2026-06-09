# ISSUE DOC #037 — Página admin login (/admin/login)

## CONTEXTO

El único usuario autenticado del sistema es el artista (rol ADMIN). Necesita una página de
login funcional en `/admin/login` que conecte con Better Auth, proteja contra fuerza bruta
y redirija al dashboard si ya tiene sesión activa.

La implementación base ya existía (commit #010) con un formulario funcional pero incompleto:
le faltaban el manejo de cuenta bloqueada (429), el redirect automático con sesión activa,
y los tests. Esta issue completa esos gaps.

---

## OBJETIVO

Completar `/admin/login` con:
1. **Redirect automático** si hay sesión activa → `/admin` (sin renderizar el form)
2. **Manejo de cuenta bloqueada** → mensaje `"Demasiados intentos. Espera 15 minutos"` cuando
   Better Auth devuelve HTTP 429
3. **Tests unitarios** cubriendo todos los flujos de la `LoginForm`

---

## SCOPE

| Archivo | Acción |
|---------|--------|
| `src/app/admin/login/login-form.tsx` | Modificar — añadir `useSession` redirect + manejo 429 |
| `tests/unit/admin/login-form.test.tsx` | Crear — tests unitarios |

---

## ANTI-SCOPE

- NO cambiar el diseño visual (ya conforme a UI-001)
- NO añadir React Hook Form / Zod (el formulario controlado con state es suficiente para este scope)
- NO implementar recuperación de contraseña
- NO modificar `page.tsx` (ya correcto)
- NO modificar la configuración de Better Auth (#010)

---

## FLUJO DE EJECUCIÓN

1. Al montar, `LoginForm` comprueba sesión via `useSession()`
2. Si `session` existe → `router.replace("/admin")` inmediatamente
3. Si `isPending` (sesión cargando) → renderiza nada / spinner mínimo
4. Sin sesión → muestra formulario
5. Submit → `signIn.email(...)` → si error 429 → mensaje bloqueado → si otro error → mensaje genérico
6. Éxito → `router.push("/admin")`

---

## REGLAS DE NEGOCIO (AUTH-001)

- **SEC-AUTH-001**: Máximo 5 intentos fallidos en ventana de 15 minutos
- **SEC-AUTH-002**: Bloqueo de 15 minutos tras superar el límite
- **SEC-AUTH-003**: Mensaje de error NO debe revelar si el email existe o no
- **SEC-AUTH-004**: Sesión activa → no mostrar formulario de login

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Con sesión activa → redirect a `/admin` sin mostrar el formulario
- [ ] Login correcto → redirect a `/admin`
- [ ] Login incorrecto → `"Credenciales incorrectas. Inténtalo de nuevo."` (genérico)
- [ ] Error HTTP 429 → `"Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo."`
- [ ] Formulario deshabilitado (inputs + botón) durante el submit
- [ ] Todos los tests pasan

---

## EDGE CASES

- `useSession` en estado `isPending` → no renderizar el form para evitar flash
- Better Auth puede devolver 429 con distintos `code` strings → discriminar por `status === 429`
- El redirect tras login exitoso usa `router.push` (no `replace`) para que el historial funcione

---

## TESTS REQUERIDOS

### Unit (`tests/unit/admin/login-form.test.tsx`, happy-dom)

- Renderiza email, contraseña y botón de submit
- Submit llama a `signIn.email` con email y password correctos
- Login exitoso → llama a `router.push("/admin")`
- Error genérico → muestra mensaje de credenciales incorrectas
- Error 429 → muestra mensaje de cuenta bloqueada
- Formulario deshabilitado durante loading

---

## DEPENDENCIAS

- #010 — Better Auth configurado (`signIn`, `useSession` disponibles en `@/lib/auth/client`)

---

## DEFINITION OF DONE

- [ ] `login-form.tsx` maneja sesión activa + error 429
- [ ] Tests: mínimo 6 casos, todos pasando
- [ ] TypeScript sin errores
- [ ] Lint limpio
- [ ] GitHub Issue #37 comentado con detalles de implementación y cerrado
- [ ] PR creado
