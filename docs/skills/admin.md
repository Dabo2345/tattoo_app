# Skill: admin

## Propósito

Guía de referencia rápida para el panel de administración.

---

## Rutas del admin

```
/admin                    ← Dashboard principal
/admin/login              ← Login Better Auth
/admin/calendar           ← Agenda semanal
/admin/appointments       ← Lista de citas
/admin/appointments/[id]  ← Detalle de cita
/admin/gallery            ← Gestión de galería
/admin/content            ← Edición de contenido público
/admin/settings           ← Configuración (horarios, pausas, depósito)
```

---

## Protección de rutas

- Middleware en `/src/middleware.ts` protege todas las rutas `/admin/*`
- Todas las APIs en `/api/admin/*` usan `withAdminAuth`
- Todas las Server Actions del admin verifican sesión con `auth.api.getSession`
- Toda acción admin genera AuditLog (RB-020)

---

## Server Actions del admin

```typescript
// Gallery
uploadGalleryImageAction(formData)
deleteGalleryImageAction(imageId)
reorderGalleryAction(imageIds[])

// Content
updateArtistProfileAction(data)
updateStudioInfoAction(data)

// Settings
updateWorkingHoursAction(data)
updateBreakTimesAction(data)
updateDepositAmountAction(amount)
```

---

## Reglas críticas

- Nunca hacer operaciones de admin sin verificar sesión primero
- Siempre generar AuditLog después de cualquier acción destructiva
- Las imágenes eliminadas pasan a soft delete (RB-019), no borrado físico
- Los cambios de horario afectan slots futuros, verificar impacto antes

---

## Audit Log

Toda acción admin loguea en la tabla `AuditLog`:

```typescript
await auditService.log({
  action: "APPOINTMENT_CANCELLED",
  entityId: appointmentId,
  entityType: "Appointment",
  adminUserId: session.user.id,
  metadata: { reason, refundAmount }
})
```

---

## Testing

Las rutas admin se testean con sesión mockeada de Better Auth.
Ver TEST-001 para los casos obligatorios de admin.
