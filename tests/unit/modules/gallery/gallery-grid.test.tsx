// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GalleryGrid } from "@/modules/gallery/components/gallery-grid"
import type { GalleryImageData, StyleTagData } from "@/modules/gallery/types"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockImages: GalleryImageData[] = [
  {
    id: "1",
    url: "https://example.com/img1.jpg",
    thumbnailUrl: "https://example.com/thumb1.jpg",
    altText: "Blackwork sleeve",
    order: 0,
    styleTags: [{ id: "t1", name: "Blackwork", slug: "blackwork" }],
  },
  {
    id: "2",
    url: "https://example.com/img2.jpg",
    thumbnailUrl: "https://example.com/thumb2.jpg",
    altText: "Geometric piece",
    order: 1,
    styleTags: [{ id: "t2", name: "Geometric", slug: "geometric" }],
  },
]

const mockTags: StyleTagData[] = [
  { id: "t1", name: "Blackwork", slug: "blackwork" },
  { id: "t2", name: "Geometric", slug: "geometric" },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GalleryGrid", () => {
  it("renders image buttons when images are provided", () => {
    render(<GalleryGrid images={mockImages} tags={[]} />)
    expect(screen.getByLabelText(/ver trabajo: blackwork sleeve/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ver trabajo: geometric piece/i)).toBeInTheDocument()
  })

  it("shows empty state message when no images", () => {
    render(<GalleryGrid images={[]} tags={[]} />)
    expect(screen.getByText(/no hay trabajos en la galería/i)).toBeInTheDocument()
  })

  it("does not render lightbox initially", () => {
    render(<GalleryGrid images={mockImages} tags={[]} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens lightbox when an image is clicked", () => {
    render(<GalleryGrid images={mockImages} tags={[]} />)
    fireEvent.click(screen.getByLabelText(/ver trabajo: blackwork sleeve/i))
    expect(screen.getByRole("dialog", { name: /imagen ampliada/i })).toBeInTheDocument()
  })

  it("closes lightbox when close button is clicked", () => {
    render(<GalleryGrid images={mockImages} tags={[]} />)
    fireEvent.click(screen.getByLabelText(/ver trabajo: blackwork sleeve/i))
    fireEvent.click(screen.getByLabelText("Cerrar imagen"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("closes lightbox when backdrop is clicked", () => {
    render(<GalleryGrid images={mockImages} tags={[]} />)
    fireEvent.click(screen.getByLabelText(/ver trabajo: blackwork sleeve/i))
    const backdrop = screen.getByRole("dialog", { name: /imagen ampliada/i })
    fireEvent.click(backdrop)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders style tag filter buttons when tags are provided", () => {
    render(<GalleryGrid images={mockImages} tags={mockTags} />)
    expect(screen.getByRole("group", { name: /filtrar por estilo/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Blackwork" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Geometric" })).toBeInTheDocument()
  })
})
