import { prisma } from "@/lib/db/prisma"
import type { CreateTattooPlanInput } from "../types/tattoo-plan"

export const tattooPlanRepository = {
  /**
   * Crea un TattooPlan con sus sesiones en una transacción atómica.
   * El plan se crea en estado DRAFT (RB-TP-001).
   */
  async create(consultationAppointmentId: string, input: CreateTattooPlanInput) {
    return prisma.$transaction(async (tx) => {
      const plan = await tx.tattooPlan.create({
        data: {
          consultationAppointmentId,
          style: input.style,
          size: input.size,
          placement: input.placement,
          description: input.description,
          notes: input.notes,
          status: "DRAFT",
        },
      })

      await tx.tattooPlanSession.createMany({
        data: input.sessions.map((s) => ({
          planId: plan.id,
          sessionNumber: s.sessionNumber,
          durationMinutes: s.durationMinutes,
          status: "PENDING",
        })),
      })

      return tx.tattooPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: { sessions: { orderBy: { sessionNumber: "asc" } } },
      })
    })
  },

  /**
   * Busca el TattooPlan vinculado a una Appointment (por consultationAppointmentId).
   * Incluye las sesiones ordenadas por sessionNumber.
   */
  async findByAppointmentId(appointmentId: string) {
    return prisma.tattooPlan.findUnique({
      where: { consultationAppointmentId: appointmentId },
      include: { sessions: { orderBy: { sessionNumber: "asc" } } },
    })
  },

  /**
   * Busca un TattooPlan por su id.
   * Incluye las sesiones ordenadas por sessionNumber.
   */
  async findById(planId: string) {
    return prisma.tattooPlan.findUnique({
      where: { id: planId },
      include: { sessions: { orderBy: { sessionNumber: "asc" } } },
    })
  },

  /**
   * Vincula un SessionLink a una TattooPlanSession y actualiza su status a LINK_SENT.
   */
  async updateSessionLinkId(sessionId: string, sessionLinkId: string) {
    return prisma.tattooPlanSession.update({
      where: { id: sessionId },
      data: { sessionLinkId, status: "LINK_SENT" },
    })
  },

  /**
   * Actualiza el status de un TattooPlan.
   */
  async updatePlanStatus(planId: string, status: "DRAFT" | "SENT" | "IN_PROGRESS" | "COMPLETED") {
    return prisma.tattooPlan.update({
      where: { id: planId },
      data: { status },
    })
  },
}
