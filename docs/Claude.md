# CLAUDE.md — EXECUTION CONTROL SYSTEM

# =========================================================
# ⚠️ PRINCIPIO ABSOLUTO DEL SISTEMA
# =========================================================

ESTE PROYECTO FUNCIONA BAJO UN SISTEMA DE CONTROL ESTRICTO.

NO SE PERMITE:

- Saltarse issues
- Trabajar sin issue asignada
- Resolver más de 1 issue a la vez
- Crear código sin documentación de issue
- Modificar arquitectura sin aprobación explícita

---

# =========================================================
# 🔥 FLUJO OBLIGATORIO DE TRABAJO
# =========================================================

TODO trabajo sigue este flujo exacto:

1. Se crea Issue en GitHub (PM-001)
2. Cada Issue tiene ID incremental (#001, #002, #003...)
3. Cada Issue tiene un ISSUE DOC asociado en /issues-docs/
4. Claude SOLO puede trabajar si se le da un Issue ID
5. Claude debe leer ISSUE DOC antes de empezar
6. Claude implementa SOLO esa issue
7. Claude crea PR
8. CI valida
9. Merge
10. FIN de issue

---

# =========================================================
# 🚫 REGLA DE BLOQUEO ABSOLUTO
# =========================================================

CLAUDE NO PUEDE:

- decidir trabajar en otra issue
- mezclar múltiples issues
- improvisar features nuevas
- modificar arquitectura global

SIN:

- crear nueva Issue aprobada

---

# =========================================================
# 📄 ISSUE DOC SYSTEM (OBLIGATORIO)
# =========================================================

Cada Issue tiene un documento:

/issues-docs/001-booking-slot-system.md

Contenido obligatorio:

- contexto
- objetivo
- archivos afectados
- reglas del sistema
- criterios de aceptación
- tests requeridos
- casos edge

---

CLAUDE DEBE:

- leer ISSUE DOC antes de tocar código
- seguirlo literalmente
- no añadir funcionalidad extra

---

# =========================================================
# 🧠 EJECUCIÓN POR ID (MODO CONTROLADO)
# =========================================================

Cuando el usuario diga:

> "resuelve issue 12"

Claude debe:

1. buscar ISSUE #12
2. abrir ISSUE DOC asociado
3. implementar SOLO lo descrito
4. no salir del scope

---

# =========================================================
# 🧪 TESTING OBLIGATORIO
# =========================================================

Ninguna issue puede cerrarse sin:

- tests incluidos
- CI verde
- validación manual lógica

---

# =========================================================
# 📦 CAMBIOS PROHIBIDOS
# =========================================================

NO se permite:

- refactor global sin issue
- cambios de arquitectura sin PM-001
- cambios UI fuera de UI-001
- lógica de negocio fuera de /modules

---

# =========================================================
# 🧭 ORDEN DE EJECUCIÓN
# =========================================================

Siempre:

PM-001 → Issue creation
→ ISSUE DOC
→ IMPLEMENTATION
→ PR
→ CI
→ MERGE

---

# =========================================================
# 🤖 MODO AGENTE
# =========================================================

Claude actúa SOLO en modo:

"Execution Agent"

NO modo creativo libre.

---

# =========================================================
# 🧾 OUTPUT OBLIGATORIO
# =========================================================

Cuando completes una issue debes responder:

- Issue ID
- Archivos modificados
- Tests añadidos
- Cómo probarlo
- Riesgos detectados

---

# =========================================================
# 🧱 REGLA FINAL
# =========================================================

Este sistema es determinista.

Si algo no está en una Issue o ISSUE DOC:

→ NO EXISTE