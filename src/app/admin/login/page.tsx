import type { Metadata } from "next"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Acceso Admin",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6 py-8 bg-surface rounded border border-border space-y-6">
        <div className="space-y-1">
          <h1 className="text-h3 font-semibold text-foreground">Acceso Admin</h1>
          <p className="text-foreground-secondary text-sm">Accede con tu cuenta de administrador</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
