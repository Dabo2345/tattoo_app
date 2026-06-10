import type { Metadata } from "next"
import { prisma } from "@/lib/db/prisma"
import { ARTIST_PROFILE_ID, STUDIO_INFO_ID } from "@/app/admin/content/actions"
import { ArtistProfileForm } from "@/components/admin/artist-profile-form"
import { StudioInfoForm } from "@/components/admin/studio-info-form"

export const metadata: Metadata = {
  title: "Contenido Admin",
  robots: { index: false, follow: false },
}

// ─── Default values (fallback before first save) ──────────────────────────────

const defaultArtistProfile = {
  name: "",
  bio: "",
  specialties: [] as string[],
  instagramHandle: undefined as string | undefined,
  yearsOfExperience: undefined as number | undefined,
}

const defaultStudioInfo = {
  name: "",
  description: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  instagramHandle: undefined as string | undefined,
  googleMapsUrl: undefined as string | undefined,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminContentPage() {
  const [artistProfile, studioInfo] = await Promise.all([
    prisma.artistProfile.findUnique({ where: { id: ARTIST_PROFILE_ID } }),
    prisma.studioInfo.findUnique({ where: { id: STUDIO_INFO_ID } }),
  ])

  const artistInitial = artistProfile
    ? {
        name: artistProfile.name,
        bio: artistProfile.bio,
        specialties: artistProfile.specialties,
        instagramHandle: artistProfile.instagramHandle ?? undefined,
        yearsOfExperience: artistProfile.yearsOfExperience ?? undefined,
      }
    : defaultArtistProfile

  const studioInitial = studioInfo
    ? {
        name: studioInfo.name,
        description: studioInfo.description,
        address: studioInfo.address,
        city: studioInfo.city,
        phone: studioInfo.phone,
        email: studioInfo.email,
        instagramHandle: studioInfo.instagramHandle ?? undefined,
        googleMapsUrl: studioInfo.googleMapsUrl ?? undefined,
      }
    : defaultStudioInfo

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-2">Contenido</h1>
      <p className="text-foreground-secondary mb-8">
        Edita el perfil del artista y la información del estudio visibles públicamente.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-lg border border-border bg-surface p-6">
          <ArtistProfileForm initial={artistInitial} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <StudioInfoForm initial={studioInitial} />
        </div>
      </div>
    </div>
  )
}
