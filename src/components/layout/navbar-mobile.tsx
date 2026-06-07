"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "/galeria", label: "Galería" },
  { href: "/perfil", label: "Artista" },
  { href: "/estudio", label: "Estudio" },
]

export function NavbarMobile() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-surface border-b border-border py-4 px-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-foreground-secondary hover:text-foreground transition-colors text-body"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/reservar"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center bg-accent hover:bg-accent-hover text-foreground font-medium px-4 py-2 rounded transition-colors"
          >
            Reservar
          </Link>
        </div>
      )}
    </div>
  )
}
