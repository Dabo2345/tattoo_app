"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// ─── Singleton ID ─────────────────────────────────────────────────────────────

export const STUDIO_CONFIG_ID = "00000000-0000-0000-0000-000000000003"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreakTime {
  id: string
  label: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

export interface ActionResult<T = undefined> {
  success: boolean
  data?: T
  error?: string
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const workingHoursSchema = z
  .object({
    workingStartHour: z.number({ error: "Debe ser un número" }).int().min(0).max(23),
    workingStartMinute: z.number({ error: "Debe ser un número" }).int().min(0).max(59),
    workingEndHour: z.number({ error: "Debe ser un número" }).int().min(0).max(23),
    workingEndMinute: z.number({ error: "Debe ser un número" }).int().min(0).max(59),
    slotDurationMinutes: z.number({ error: "Debe ser un número" }).int().min(15).max(120),
    consultationDurationMinutes: z.number({ error: "Debe ser un número" }).int().min(30).max(240),
  })
  .refine(
    (d) =>
      d.workingStartHour * 60 + d.workingStartMinute < d.workingEndHour * 60 + d.workingEndMinute,
    { message: "El horario de inicio debe ser anterior al horario de fin" }
  )
  .refine(
    (d) => {
      const windowMinutes =
        d.workingEndHour * 60 +
        d.workingEndMinute -
        (d.workingStartHour * 60 + d.workingStartMinute)
      return windowMinutes >= d.consultationDurationMinutes
    },
    { message: "La ventana laboral debe ser mayor o igual a la duración de la consulta" }
  )

const breakTimeItemSchema = z
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

const breakTimesSchema = z.object({
  breaks: z.array(breakTimeItemSchema).max(10),
})

const depositSchema = z.object({
  depositAmount: z
    .number({ error: "Debe ser un número" })
    .min(0, "El depósito no puede ser negativo")
    .max(9999.99),
})

export type WorkingHoursInput = z.infer<typeof workingHoursSchema>
export type BreakTimesInput = z.infer<typeof breakTimesSchema>
export type DepositInput = z.infer<typeof depositSchema>

// ─── getAdminSession ──────────────────────────────────────────────────────────

async function getAdminSession() {
  return auth.api.getSession({ headers: await headers() })
}

// ─── updateWorkingHoursAction ─────────────────────────────────────────────────

export async function updateWorkingHoursAction(input: WorkingHoursInput): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "No autorizado" }

  const parsed = workingHoursSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const {
    workingStartHour,
    workingStartMinute,
    workingEndHour,
    workingEndMinute,
    slotDurationMinutes,
    consultationDurationMinutes,
  } = parsed.data

  await prisma.studioConfig.upsert({
    where: { id: STUDIO_CONFIG_ID },
    update: {
      workingStartHour,
      workingStartMinute,
      workingEndHour,
      workingEndMinute,
      slotDurationMinutes,
      consultationDurationMinutes,
    },
    create: {
      id: STUDIO_CONFIG_ID,
      workingStartHour,
      workingStartMinute,
      workingEndHour,
      workingEndMinute,
      slotDurationMinutes,
      consultationDurationMinutes,
      breaks: [],
    },
  })

  await prisma.auditLog.create({
    data: {
      action: "WORKING_HOURS_UPDATED",
      entityId: STUDIO_CONFIG_ID,
      entityType: "StudioConfig",
      adminUserId: session.user.id,
      metadata: {
        workingStartHour,
        workingStartMinute,
        workingEndHour,
        workingEndMinute,
        slotDurationMinutes,
        consultationDurationMinutes,
      },
    },
  })

  return { success: true }
}

// ─── updateBreakTimesAction ───────────────────────────────────────────────────

export async function updateBreakTimesAction(input: BreakTimesInput): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "No autorizado" }

  const parsed = breakTimesSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await prisma.studioConfig.upsert({
    where: { id: STUDIO_CONFIG_ID },
    update: { breaks: parsed.data.breaks },
    create: { id: STUDIO_CONFIG_ID, breaks: parsed.data.breaks },
  })

  await prisma.auditLog.create({
    data: {
      action: "BREAK_TIMES_UPDATED",
      entityId: STUDIO_CONFIG_ID,
      entityType: "StudioConfig",
      adminUserId: session.user.id,
      metadata: { count: parsed.data.breaks.length },
    },
  })

  return { success: true }
}

// ─── updateDepositAmountAction ────────────────────────────────────────────────

export async function updateDepositAmountAction(input: DepositInput): Promise<ActionResult> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "No autorizado" }

  const parsed = depositSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  await prisma.studioConfig.upsert({
    where: { id: STUDIO_CONFIG_ID },
    update: { depositAmount: parsed.data.depositAmount },
    create: { id: STUDIO_CONFIG_ID, depositAmount: parsed.data.depositAmount, breaks: [] },
  })

  await prisma.auditLog.create({
    data: {
      action: "DEPOSIT_AMOUNT_UPDATED",
      entityId: STUDIO_CONFIG_ID,
      entityType: "StudioConfig",
      adminUserId: session.user.id,
      metadata: { depositAmount: parsed.data.depositAmount },
    },
  })

  return { success: true }
}
