import { z } from "zod"

export const consultationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Introduce un email válido"),
  phone: z
    .string()
    .min(9, "Introduce un teléfono válido")
    .regex(/^[+\d\s\-()]{9,20}$/, "Formato de teléfono inválido"),
  tattooDescription: z
    .string()
    .min(20, "Describe tu idea con al menos 20 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
})

export type ConsultationFormData = z.infer<typeof consultationSchema>
