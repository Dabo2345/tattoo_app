import { z } from "zod"

const tattooSessionSchema = z.object({
  sessionNumber: z.number().int().min(1).max(10),
  durationMinutes: z
    .number()
    .int()
    .min(30)
    .max(600)
    .refine((v) => v % 30 === 0, {
      message: "La duración debe ser múltiplo de 30 minutos",
    }),
})

export const createTattooPlanSchema = z.object({
  style: z.string().min(1).max(100),
  size: z.string().min(1).max(100),
  placement: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  notes: z.string().max(1000).optional(),
  sessions: z
    .array(tattooSessionSchema)
    .min(1, { message: "Debe haber al menos 1 sesión" })
    .max(10, { message: "El máximo es 10 sesiones" }),
})

export type CreateTattooPlanSchema = z.infer<typeof createTattooPlanSchema>
