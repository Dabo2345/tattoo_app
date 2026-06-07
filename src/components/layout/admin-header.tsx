import Link from "next/link"
import { LayoutDashboard, Calendar, Images, FileText, Settings } from "lucide-react"

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Citas", icon: Calendar },
  { href: "/admin/gallery", label: "Galería", icon: Images },
  { href: "/admin/content", label: "Contenido", icon: FileText },
  { href: "/admin/settings", label: "Ajustes", icon: Settings },
]

export function AdminHeader() {
  return (
    <header className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/admin" className="text-foreground font-semibold text-h4">
          Admin
        </Link>
        <nav className="flex items-center gap-1">
          {adminLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-surface rounded transition-colors"
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
