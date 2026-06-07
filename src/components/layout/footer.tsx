import Link from "next/link"
import { MapPin, Mail, Phone, Share2 } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="flex items-start gap-3 text-foreground-secondary">
            <MapPin size={18} className="mt-0.5 shrink-0 text-accent" />
            <span className="text-sm">
              Calle del Estudio 1,
              <br />
              Madrid, España
            </span>
          </div>
          <div className="flex items-center gap-3 text-foreground-secondary">
            <Mail size={18} className="shrink-0 text-accent" />
            <a
              href="mailto:hola@tattostudio.com"
              className="text-sm hover:text-foreground transition-colors"
            >
              hola@tattostudio.com
            </a>
          </div>
          <div className="flex items-center gap-3 text-foreground-secondary">
            <Phone size={18} className="shrink-0 text-accent" />
            <a href="tel:+34600000000" className="text-sm hover:text-foreground transition-colors">
              +34 600 000 000
            </a>
          </div>
          <div className="flex items-center gap-3 text-foreground-secondary">
            <Share2 size={18} className="shrink-0 text-accent" />
            <a
              href="https://instagram.com/tattostudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-foreground transition-colors"
            >
              @tattostudio
            </a>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-foreground-muted text-sm">
            © {currentYear} Tattoo Studio. Todos los derechos reservados.
          </p>
          <Link
            href="/reservar"
            className="text-accent hover:text-accent-hover text-sm transition-colors"
          >
            Reservar consulta
          </Link>
        </div>
      </div>
    </footer>
  )
}
