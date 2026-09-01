# ISSUE DOC #076 — Mejora: al generar SessionLink desde admin mostrar confirmación de email en vez de URL copiable

**Issue GitHub:** #076 (Dabo2345/tattoo_app#146)
**Tipo:** enhancement
**Prioridad:** P2: Medium
**Rama:** `feature/076-session-link-confirmacion-email`
**Estado:** PENDIENTE
**Fecha:** 2026-06-18

---

## 1. CONTEXTO

Actualmente, al generar un SessionLink desde el panel de admin, la UI muestra la URL generada en un campo de texto copiable (`session-link-result` view en `weekly-agenda.tsx`). El email ya se envía automáticamente al cliente. Mostrar la URL en pantalla es redundante, puede generar confusión sobre si hay que enviarla manualmente, y expone el token en la UI del admin.

---

## 2. OBJETIVO

Sustituir la vista `session-link-result` que muestra la URL copiable por una confirmación de éxito simple: "El enlace ha sido enviado al cliente por email." El admin sabe que el cliente ya lo tiene, sin necesidad de copiar ninguna URL.

---

## 3. SCOPE

- Cambiar `weekly-agenda.tsx`: reemplazar la vista `session-link-result` (URL + botón copiar) por una confirmación de texto con icono de éxito
- Opcionalmente: quitar `url` de la respuesta del API si ya no se necesita en el frontend (cleanup)

---

## 4. ANTI-SCOPE

- NO desactivar el envío del email (sigue funcionando igual)
- NO modificar el template de email
- NO cambiar la lógica de creación del SessionLink

---

## 5. ARCHIVOS AFECTADOS

### Código
- `src/components/admin/weekly-agenda.tsx` — reemplazar la view `session-link-result`
- `src/app/api/admin/session-links/route.ts` — (opcional) eliminar `url` de la respuesta

### Tests
- No se requieren tests nuevos — cambio puramente de UI

### Docs
- `docs/Documento 09 — FRONT-001 — Arquitectura Frontend.md` — actualizar descripción del panel de admin
- `docs/Documento 05 — API-001 — Diseño de APIs y Contratos del Sistema.md` — actualizar respuesta de `POST /api/admin/session-links`

---

## 6. FLUJO DE EJECUCIÓN

1. En `weekly-agenda.tsx`, localizar la view `session-link-result`
2. Reemplazar el contenido (URL + botón copiar) por:
   ```tsx
   <div className="text-center py-4">
     <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
     <p className="text-sm font-medium text-foreground mb-1">Enlace enviado</p>
     <p className="text-xs text-foreground-secondary mb-4">
       El cliente recibirá el enlace de reserva en su email.
     </p>
     <Button variant="outline" size="sm" onClick={() => setView("detail")}>
       Volver al detalle
     </Button>
   </div>
   ```
3. Eliminar el estado `generatedLink` y `copied` si ya no se usan
4. En el route del API (opcional): eliminar `url` de la respuesta o mantenerlo por compatibilidad
5. Actualizar docs

---

## 7. REGLAS DE NEGOCIO

- **RB-SL-UI-001:** El admin no necesita ver ni copiar la URL del SessionLink. El email automático es el canal de entrega al cliente.

---

## 8. CRITERIOS DE ACEPTACIÓN

- [ ] Al generar un SessionLink, la UI muestra "Enlace enviado" con icono de check (no URL copiable)
- [ ] No hay ningún texto con el token del link visible en la UI del admin
- [ ] CI verde

---

## 9. EDGE CASES

- **Email fallido:** Si el email falla (Resend error), el admin no tiene forma de reenviar. Esto está fuera del scope de esta issue — se registra en `Notification.status = FAILED` y se puede abordar en una issue de reintento de emails en el futuro.

---

## 10. TESTS REQUERIDOS

Ninguno nuevo — cambio de UI sin lógica de negocio.

---

## 11. DOCUMENTACIÓN AFECTADA

| Documento | Sección | Cambio |
|-----------|---------|--------|
| `FRONT-001` | Panel admin — DetailPanel | Actualizar descripción del flujo de SessionLink |
| `API-001` | Session Links — Crear SessionLink | Actualizar respuesta (sin `url` si se elimina) |

---

## 12. DEPENDENCIAS

- **#075 debe estar MERGEADA** — la URL correcta debe estar en el email antes de eliminar la URL copiable del panel.

---

## 13. DEFINITION OF DONE

- [ ] Vista `session-link-result` muestra confirmación de email enviado (no URL)
- [ ] No se expone el token en la UI del admin
- [ ] CI verde
- [ ] Docs actualizados
- [ ] PR creado
