import { z } from "zod"

// Vive fuera de actions.ts: un archivo "use server" solo puede exportar funciones async,
// y este schema se reutiliza en page.tsx para validar el JSONB de breaks al leer (#168).

export const breakTimeItemSchema = z
  .object({
    id: z.string().uuid(),
    label: z.string().min(1, "El nombre de la pausa es requerido").max(100),
    startHour: z.number({ error: "Debe ser un número" }).int().min(0).max(23),
    startMinute: z.number({ error: "Debe ser un número" }).int().min(0).max(59),
    endHour: z.number({ error: "Debe ser un número" }).int().min(0).max(23),
    endMinute: z.number({ error: "Debe ser un número" }).int().min(0).max(59),
  })
  .refine((b) => b.startHour * 60 + b.startMinute < b.endHour * 60 + b.endMinute, {
    message: "El inicio de la pausa debe ser anterior al fin",
  })

export const breaksArraySchema = z.array(breakTimeItemSchema)
