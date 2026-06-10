import { z } from "zod"

export const createConsultationSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(100),
    email: z.string().email("Email inválido"),
    phone: z.string().min(9, "Teléfono demasiado corto").max(20, "Teléfono demasiado largo"),
    tattooDescription: z
      .string()
      .min(1, "La descripción es obligatoria")
      .max(1000, "Descripción demasiado larga"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "endsAt debe ser posterior a startsAt",
    path: ["endsAt"],
  })

export type CreateConsultationSchema = z.infer<typeof createConsultationSchema>
