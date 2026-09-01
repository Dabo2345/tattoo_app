export interface CreateTattooPlanInput {
  style: string
  size: string
  placement: string
  description: string
  notes?: string
  sessions: Array<{ sessionNumber: number; durationMinutes: number }>
}

export interface TattooPlanSessionData {
  id: string
  planId: string
  sessionNumber: number
  durationMinutes: number
  sessionLinkId: string | null
  status: "PENDING" | "LINK_SENT" | "BOOKED" | "COMPLETED"
  createdAt: Date
  updatedAt: Date
}

export interface TattooPlanWithSessions {
  id: string
  consultationAppointmentId: string
  style: string
  size: string
  placement: string
  description: string
  notes: string | null
  status: "DRAFT" | "SENT" | "IN_PROGRESS" | "COMPLETED"
  createdAt: Date
  updatedAt: Date
  sessions: TattooPlanSessionData[]
}

export interface SendPlanResult {
  planId: string
  status: "SENT"
  sessionsCount: number
}
