import type { Metadata } from "next"
import { prisma } from "@/lib/db/prisma"
import { breaksArraySchema } from "@/app/admin/settings/actions"
import { logger } from "@/lib/logger"
import { WorkingHoursForm } from "@/components/admin/working-hours-form"
import { BreakTimesForm } from "@/components/admin/break-times-form"
import { DepositForm } from "@/components/admin/deposit-form"

export const metadata: Metadata = {
  title: "Ajustes Admin",
  robots: { index: false, follow: false },
}

const defaults = {
  workingStartHour: 10,
  workingStartMinute: 0,
  workingEndHour: 20,
  workingEndMinute: 0,
  slotDurationMinutes: 30,
  consultationDurationMinutes: 60,
  depositAmount: 50,
  breaks: [],
}

export default async function AdminSettingsPage() {
  const config = await prisma.studioConfig.findUnique({
    where: { id: "00000000-0000-0000-0000-000000000003" },
  })

  const workingHoursInitial = config
    ? {
        workingStartHour: config.workingStartHour,
        workingStartMinute: config.workingStartMinute,
        workingEndHour: config.workingEndHour,
        workingEndMinute: config.workingEndMinute,
        slotDurationMinutes: config.slotDurationMinutes,
        consultationDurationMinutes: config.consultationDurationMinutes,
      }
    : {
        workingStartHour: defaults.workingStartHour,
        workingStartMinute: defaults.workingStartMinute,
        workingEndHour: defaults.workingEndHour,
        workingEndMinute: defaults.workingEndMinute,
        slotDurationMinutes: defaults.slotDurationMinutes,
        consultationDurationMinutes: defaults.consultationDurationMinutes,
      }

  const breaksResult = breaksArraySchema.safeParse(config?.breaks ?? [])
  if (!breaksResult.success) {
    logger.warn(
      { issues: breaksResult.error.issues },
      "breaks JSONB en BD no supera validación Zod — usando fallback vacío"
    )
  }
  const breaksInitial = breaksResult.success ? breaksResult.data : defaults.breaks

  const depositInitial = {
    depositAmount: config ? Number(config.depositAmount) : defaults.depositAmount,
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-2">Ajustes</h1>
      <p className="text-foreground-secondary mb-8">
        Configura los horarios, pausas y depósito del estudio.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-lg border border-border bg-surface p-6">
          <WorkingHoursForm initial={workingHoursInitial} />
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <BreakTimesForm initial={breaksInitial} />
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <DepositForm initial={depositInitial} />
        </div>
      </div>
    </div>
  )
}
