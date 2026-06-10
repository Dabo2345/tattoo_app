"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { updateArtistProfileAction, type ArtistProfileInput } from "@/app/admin/content/actions"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtistProfileFormProps {
  initial: ArtistProfileInput
}

// ─── ArtistProfileForm ────────────────────────────────────────────────────────

export function ArtistProfileForm({ initial }: ArtistProfileFormProps) {
  const [name, setName] = useState(initial.name)
  const [bio, setBio] = useState(initial.bio)
  const [specialtiesRaw, setSpecialtiesRaw] = useState(initial.specialties.join(", "))
  const [instagramHandle, setInstagramHandle] = useState(initial.instagramHandle ?? "")
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initial.yearsOfExperience != null ? String(initial.yearsOfExperience) : ""
  )

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const specialties = specialtiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const input: ArtistProfileInput = {
      name,
      bio,
      specialties,
      instagramHandle: instagramHandle || undefined,
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : undefined,
    }

    startTransition(async () => {
      const result = await updateArtistProfileAction(input)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? "Error al guardar")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario perfil artista">
      <h2 className="text-sm font-semibold text-foreground">Perfil del artista</h2>

      <div>
        <label
          htmlFor="artist-name"
          className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
        >
          Nombre
        </label>
        <input
          id="artist-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="artist-bio"
          className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
        >
          Bio
        </label>
        <textarea
          id="artist-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={2000}
          rows={5}
          required
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <p className="text-[10px] text-foreground-muted mt-1">{bio.length}/2000</p>
      </div>

      <div>
        <label
          htmlFor="artist-specialties"
          className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
        >
          Especialidades (separadas por coma)
        </label>
        <input
          id="artist-specialties"
          type="text"
          value={specialtiesRaw}
          onChange={(e) => setSpecialtiesRaw(e.target.value)}
          placeholder="Realismo, Blackwork, Acuarela"
          required
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="artist-instagram"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Instagram (opcional)
          </label>
          <input
            id="artist-instagram"
            type="text"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            maxLength={50}
            placeholder="@tuusuario"
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="artist-years"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Años de experiencia (opcional)
          </label>
          <input
            id="artist-years"
            type="number"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            min={0}
            max={60}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-xs text-green-400">
          Perfil guardado correctamente.
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar perfil"}
      </Button>
    </form>
  )
}
