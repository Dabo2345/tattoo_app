"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { updateStudioInfoAction, type StudioInfoInput } from "@/app/admin/content/actions"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioInfoFormProps {
  initial: StudioInfoInput
}

// ─── StudioInfoForm ───────────────────────────────────────────────────────────

export function StudioInfoForm({ initial }: StudioInfoFormProps) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [address, setAddress] = useState(initial.address)
  const [city, setCity] = useState(initial.city)
  const [phone, setPhone] = useState(initial.phone)
  const [email, setEmail] = useState(initial.email)
  const [instagramHandle, setInstagramHandle] = useState(initial.instagramHandle ?? "")
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initial.googleMapsUrl ?? "")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const input: StudioInfoInput = {
      name,
      description,
      address,
      city,
      phone,
      email,
      instagramHandle: instagramHandle || undefined,
      googleMapsUrl: googleMapsUrl || undefined,
    }

    startTransition(async () => {
      const result = await updateStudioInfoAction(input)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? "Error al guardar")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario información estudio">
      <h2 className="text-sm font-semibold text-foreground">Información del estudio</h2>

      <div>
        <label
          htmlFor="studio-name"
          className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
        >
          Nombre del estudio
        </label>
        <input
          id="studio-name"
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
          htmlFor="studio-description"
          className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
        >
          Descripción
        </label>
        <textarea
          id="studio-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          required
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <p className="text-[10px] text-foreground-muted mt-1">{description.length}/2000</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="studio-address"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Dirección
          </label>
          <input
            id="studio-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={200}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="studio-city"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Ciudad
          </label>
          <input
            id="studio-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={100}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="studio-phone"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Teléfono
          </label>
          <input
            id="studio-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="studio-email"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Email de contacto
          </label>
          <input
            id="studio-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={100}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="studio-instagram"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Instagram (opcional)
          </label>
          <input
            id="studio-instagram"
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
            htmlFor="studio-maps"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Google Maps URL (opcional)
          </label>
          <input
            id="studio-maps"
            type="url"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
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
          Información del estudio guardada correctamente.
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar estudio"}
      </Button>
    </form>
  )
}
