// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateConsultationInput {
  name: string
  email: string
  phone: string
  tattooDescription: string
  startsAt: Date
  endsAt: Date
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

export interface CreateConsultationResult {
  appointmentId: string
  clientId: string
}
