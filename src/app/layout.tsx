import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/lib/env"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Estudio de Tatuajes",
    template: "%s | Estudio de Tatuajes",
  },
  description: "Estudio de tatuajes profesional. Reserva tu consulta online.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}
