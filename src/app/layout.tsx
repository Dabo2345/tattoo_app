import type { Metadata } from "next"
import "@/lib/env"
import "./globals.css"

export const metadata: Metadata = {
  title: "Tattoo Studio",
  description: "Book your tattoo appointment",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
