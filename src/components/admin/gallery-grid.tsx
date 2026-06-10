"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Trash2, GripVertical } from "lucide-react"
import { reorderGalleryAction, deleteGalleryImageAction } from "@/app/admin/gallery/actions"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GalleryImageItem {
  id: string
  url: string
  thumbnailUrl: string
  altText: string | null
  order: number
}

// ─── SortableImageCard ────────────────────────────────────────────────────────

function SortableImageCard({
  image,
  onDelete,
  isDeleting,
}: {
  image: GalleryImageItem
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden border border-border bg-surface"
    >
      <div className="relative aspect-square">
        <Image
          src={image.thumbnailUrl}
          alt={image.altText ?? "Imagen de galería"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
        className="absolute top-1 left-1 p-1 rounded bg-background/70 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Delete button */}
      <button
        onClick={() => onDelete(image.id)}
        disabled={isDeleting}
        aria-label={`Eliminar imagen ${image.id}`}
        className="absolute top-1 right-1 p-1 rounded bg-background/70 text-foreground-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── GalleryGrid ──────────────────────────────────────────────────────────────

export function GalleryGrid({ initialImages }: { initialImages: GalleryImageItem[] }) {
  const [images, setImages] = useState<GalleryImageItem[]>(initialImages)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setImages((current) => {
      const oldIndex = current.findIndex((i) => i.id === active.id)
      const newIndex = current.findIndex((i) => i.id === over.id)
      const reordered = arrayMove(current, oldIndex, newIndex)

      startTransition(async () => {
        const result = await reorderGalleryAction(reordered.map((i) => i.id))
        if (!result.success) {
          setError(result.error ?? "Error al reordenar")
        }
      })

      return reordered
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteGalleryImageAction(id)
    if (result.success) {
      setImages((current) => current.filter((i) => i.id !== id))
    } else {
      setError(result.error ?? "Error al eliminar la imagen")
    }
    setDeletingId(null)
  }

  if (images.length === 0) {
    return (
      <p className="text-sm text-foreground-muted text-center py-10">
        No hay imágenes en la galería. Sube la primera.
      </p>
    )
  }

  return (
    <div>
      {error && (
        <p role="alert" className="text-xs text-destructive mb-4">
          {error}
        </p>
      )}
      {isPending && <p className="text-xs text-foreground-secondary mb-2">Guardando orden...</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <SortableImageCard
                key={image.id}
                image={image}
                onDelete={handleDelete}
                isDeleting={deletingId === image.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
