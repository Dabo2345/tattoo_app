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
