import { AdminHeader } from "@/components/layout/admin-header"

// Auth protection will be added in issue #010 (Better Auth)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AdminHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
