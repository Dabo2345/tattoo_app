// ─── Gallery types ────────────────────────────────────────────────────────────

export interface StyleTagData {
  id: string
  name: string
  slug: string
}

export interface GalleryImageData {
  id: string
  url: string
  thumbnailUrl: string
  altText: string | null
  order: number
  styleTags: StyleTagData[]
}

// ─── Admin types ──────────────────────────────────────────────────────────────

export interface AdminGalleryImageData {
  id: string
  url: string
  thumbnailUrl: string
  altText: string | null
  order: number
}

export interface AdminStyleTagData {
  id: string
  name: string
}

// ─── Write input types ────────────────────────────────────────────────────────

export interface CreateGalleryImageInput {
  url: string
  thumbnailUrl: string
  altText: string | null
  order: number
  styleTagIds: string[]
}
