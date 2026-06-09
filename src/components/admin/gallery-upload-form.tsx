"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { uploadGalleryImageAction } from "@/app/admin/gallery/actions"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StyleTagOption {
  id: string
  name: string
}

// ─── GalleryUploadForm ────────────────────────────────────────────────────────

export function GalleryUploadForm({ styleTags }: { styleTags: StyleTagOption[] }) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [altText, setAltText] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setError(null)
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  function handleReset() {
    setOpen(false)
    setSelectedFile(null)
    setAltText("")
    setSelectedTagIds([])
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    const formData = new FormData()
    formData.append("file", selectedFile)
    if (altText) formData.append("altText", altText)
    selectedTagIds.forEach((id) => formData.append("styleTagIds", id))

    startTransition(async () => {
      const result = await uploadGalleryImageAction(formData)
      if (result.success) {
        handleReset()
        router.refresh()
      } else {
        setError(result.error ?? "Error al subir la imagen")
      }
    })
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
        Subir imagen
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 relative mb-6">
      <button
        onClick={handleReset}
        aria-label="Cerrar formulario de upload"
        className="absolute top-3 right-3 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <h2 className="text-sm font-semibold text-foreground mb-4">Subir imagen</h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-label="Formulario de subida de imagen"
      >
        <div>
          <label
            htmlFor="gallery-file"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Archivo (JPEG o WebP, máx 10MB)
          </label>
          <input
            id="gallery-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/webp"
            onChange={handleFileChange}
            required
            className="w-full text-sm text-foreground-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:text-foreground file:bg-background hover:file:bg-surface transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="gallery-alt"
            className="text-xs text-foreground-muted uppercase tracking-wide mb-1 block"
          >
            Texto alternativo (opcional)
          </label>
          <input
            id="gallery-alt"
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            maxLength={200}
            placeholder="Describe la imagen..."
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {styleTags.length > 0 && (
          <div>
            <p className="text-xs text-foreground-muted uppercase tracking-wide mb-2">Estilos</p>
            <div className="flex flex-wrap gap-2">
              {styleTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={selectedTagIds.includes(tag.id)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? "border-accent bg-accent/20 text-foreground"
                      : "border-border bg-background text-foreground-secondary hover:border-accent"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending || !selectedFile}>
            {isPending ? "Subiendo..." : "Subir imagen"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
