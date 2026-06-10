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
