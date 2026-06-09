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

export interface CreateMagicLinkResult {
  /** Token plano para incluir en la URL. Nunca se almacena en DB. */
  token: string
  expiresAt: Date
}

export interface ValidateMagicLinkResult {
  appointment: {
    id: string
    type: string
    status: string
    startsAt: Date
    endsAt: Date
    notes: string | null
    client: {
      id: string
      name: string
      email: string
      phone: string
    }
  }
}

export interface CreateSessionLinkInput {
  appointmentId: string
  sessionDurationMinutes: number
  artistNotes?: string
}

export interface CreateSessionLinkResult {
  /** Token plano para incluir en la URL. Nunca se almacena en DB. */
  token: string
  expiresAt: Date
}

export interface ValidateSessionLinkResult {
  expiresAt: Date
  sessionDurationMinutes: number
  artistNotes: string | null
}
