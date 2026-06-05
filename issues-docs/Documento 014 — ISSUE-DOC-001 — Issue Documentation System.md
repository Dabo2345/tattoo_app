# ISSUE-DOC-001 — Issue Documentation System

## Estado

Activo (OBLIGATORIO)

## Versión

1.0

---

# 1. OBJETIVO

Definir el formato obligatorio de documentación para cada Issue del sistema.

Cada Issue debe tener un documento asociado que actúa como:

> 🔒 “Contrato de ejecución inmutable para Claude”

---

# 2. PRINCIPIO FUNDAMENTAL

> Claude NO decide cómo resolver una issue. Solo ejecuta lo que está en su ISSUE DOC.

---

# 3. REGLA DE EXISTENCIA

Si una tarea:

* no está en un ISSUE DOC
* o no está en GitHub Issue

👉 entonces NO existe.

---

# 4. ESTRUCTURA OBLIGATORIA DEL ISSUE DOC

Cada archivo debe seguir este formato EXACTO:

---

## 📌 TEMPLATE

```md id="issue-doc-template"
# ISSUE #[ID] — [Título]

---

# 1. CONTEXTO

Explicación del problema a resolver.

Debe incluir:
- por qué existe esta issue
- qué problema resuelve
- en qué módulo impacta

---

# 2. OBJETIVO

Qué se debe construir exactamente.

Debe ser:

- específico
- medible
- sin ambigüedad

❌ Prohibido:
“mejorar sistema de reservas”

✔ Correcto:
“implementar validación de slots ocupados en Booking Engine”

---

# 3. ALCANCE (SCOPE)

Qué incluye esta issue.

Ejemplo:

- creación de endpoint
- validación de slots
- integración con Supabase

---

# 4. FUERA DE ALCANCE (ANTI-SCOPE)

CRÍTICO

Define lo que NO se puede tocar.

Ejemplo:

- no modificar UI global
- no cambiar auth system
- no refactor de arquitectura

---

# 5. ARCHIVOS AFECTADOS

Lista explícita:

- /modules/booking/
- /app/api/booking/
- /lib/supabase/

---

# 6. FLUJO DE EJECUCIÓN

Paso a paso obligatorio:

1. leer contexto
2. revisar dependencias
3. implementar lógica backend
4. implementar frontend si aplica
5. añadir validaciones
6. añadir tests
7. ejecutar CI local

---

# 7. REGLAS DE NEGOCIO

Reglas estrictas del dominio.

Ejemplo:

- slots no pueden solaparse
- cancelación < 4 días no tiene reembolso
- magic link expira en 2 horas

---

# 8. CRITERIOS DE ACEPTACIÓN

Checklist verificable:

- [ ] funciona el flujo principal
- [ ] casos edge cubiertos
- [ ] tests pasan
- [ ] no rompe otros módulos

---

# 9. CASOS EDGE

Obligatorio listar:

- slot ya ocupado
- cancelación simultánea
- webhook duplicado
- link expirado

---

# 10. TESTS REQUERIDOS

- unit tests
- integration tests si aplica
- e2e si afecta flujo completo

---

# 11. DEPENDENCIAS

Qué issues deben estar terminadas antes.

Ejemplo:

- Issue #003 (Auth)
- Issue #005 (Supabase schema)

---

# 12. DEFINICIÓN DE DONE

Una issue SOLO está terminada si:

- código implementado
- tests añadidos
- CI verde
- PR creado
- revisión aprobada

---

# 13. REGLA DE CLAUDE (OBLIGATORIA)

Claude debe:

- leer este documento completo antes de empezar
- no añadir funcionalidad no descrita
- no modificar arquitectura
- no optimizar fuera de scope
```

---

# 2. 🧠 CÓMO SE USA ESTE SISTEMA (IMPORTANTE)

Ahora tu flujo real es este:

---

## 🔥 FLUJO FINAL CONTROLADO

```text id="flow001"
1. GitHub Issue creado (#12)
2. ISSUE DOC creado (/issues-docs/012.md)
3. Tú ejecutas:

   "claude resolve issue 12"

4. Claude hace:

   - lee ISSUE DOC
   - implementa SOLO eso
   - escribe tests
   - ejecuta CI
   - crea PR

5. Merge
```

---

# 3. 📁 ESTRUCTURA FINAL DEL SISTEMA

Tu repo ahora debería quedar así:

```bash id="structure001"
/app
/modules
/lib

/issues
  001.json
  002.json

/issues-docs
  001-booking-slot.md
  002-stripe-checkout.md

/docs
  CLAUDE.md
  PM-001.md
  DEVOPS-001.md
  TEST-001.md
  ISSUE-DOC-001.md
```

---

