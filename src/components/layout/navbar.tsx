import Link from "next/link"
import { NavbarMobile } from "./navbar-mobile"

const navLinks = [
  { href: "/galeria", label: "Galería" },
  { href: "/perfil", label: "Artista" },
  { href: "/estudio", label: "Estudio" },
]

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-foreground font-semibold text-h4 tracking-tight">
          Tattoo Studio
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground-secondary hover:text-foreground transition-colors text-sm"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/reservar"
            className="inline-flex items-center bg-accent hover:bg-accent-hover text-foreground font-medium px-4 py-2 rounded text-sm transition-colors"
          >
            Reservar
          </Link>
        </div>

        {/* Mobile nav */}
        <NavbarMobile />
      </nav>
    </header>
  )
}
