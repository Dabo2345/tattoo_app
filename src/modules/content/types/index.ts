// ─── Content types ────────────────────────────────────────────────────────────

export interface ArtistProfile {
  name: string
  tagline: string
  bio: string
  specialties: string[]
  experience: string
  photoUrl: string | null
  instagram: string | null
  location: string
}

export interface WorkingHours {
  day: string
  hours: string
}

export interface StudioInfo {
  name: string
  tagline: string
  description: string
  address: string
  city: string
  phone: string
  email: string
  workingHours: WorkingHours[]
  parkingInfo: string | null
  accessibilityInfo: string | null
  hygieneInfo: string
}
