import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Acceso Admin",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6 py-8 bg-surface rounded border border-border">
        <h1 className="text-h3 text-foreground mb-2">Acceso Admin</h1>
        <p className="text-foreground-secondary text-sm">
          Autenticación — próximamente (issue #010).
        </p>
      </div>
    </div>
  )
}
