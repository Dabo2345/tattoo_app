"use client"

import { useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GalleryImageData, StyleTagData } from "../types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryGridProps {
  images: GalleryImageData[]
  tags: StyleTagData[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GalleryGrid({ images, tags }: GalleryGridProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<GalleryImageData | null>(null)

  const closeLightbox = useCallback(() => setLightbox(null), [])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [lightbox, closeLightbox])

  const filtered = activeTag
    ? images.filter((img) => img.styleTags.some((t) => t.slug === activeTag))
    : images

  if (images.length === 0) {
    return (
      <p className="text-foreground-secondary text-center py-16">
        No hay trabajos en la galería aún.
      </p>
    )
  }

  return (
    <>
      {/* ── Tag filter ───────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filtrar por estilo">
          <button
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTag === null
                ? "bg-accent border-accent text-foreground"
                : "bg-transparent border-border text-foreground-secondary hover:border-accent hover:text-foreground"
            )}
          >
            Todos
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(tag.slug)}
              aria-pressed={activeTag === tag.slug}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTag === tag.slug
                  ? "bg-accent border-accent text-foreground"
                  : "bg-transparent border-border text-foreground-secondary hover:border-accent hover:text-foreground"
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Masonry grid ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="text-foreground-secondary text-center py-12">
          No hay trabajos para este estilo.
        </p>
      ) : (
        <ul
          className="columns-2 md:columns-3 lg:columns-4 gap-3"
          aria-label="Trabajos de la galería"
        >
          {filtered.map((image) => (
            <li key={image.id} className="mb-3 break-inside-avoid">
              <button
                onClick={() => setLightbox(image)}
                aria-label={`Ver trabajo: ${image.altText ?? image.id}`}
                className="block w-full rounded-lg overflow-hidden bg-surface
                  hover:opacity-90 transition-opacity
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumbnailUrl}
                  alt={image.altText ?? ""}
                  loading="lazy"
                  className="w-full h-auto"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Cerrar imagen"
              onClick={closeLightbox}
              className={cn(
                "absolute -top-4 -right-4 flex h-8 w-8 items-center justify-center",
                "rounded-full bg-surface border border-border text-foreground",
                "hover:bg-surface-hover transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.altText ?? ""}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            {lightbox.altText && (
              <p className="text-center text-sm text-foreground-secondary mt-3">
                {lightbox.altText}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
