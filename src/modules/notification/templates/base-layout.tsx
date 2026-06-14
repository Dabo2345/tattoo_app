import { Body, Container, Head, Html, Preview, Text, Hr } from "@react-email/components"
import type { ReactNode } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BaseLayoutProps {
  preview: string
  children: ReactNode
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bodyStyle = {
  backgroundColor: "#0a0a0a",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: "0",
  padding: "0",
}

const containerStyle = {
  backgroundColor: "#141414",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  margin: "40px auto",
  maxWidth: "560px",
  padding: "40px 32px",
}

const footerTextStyle = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
}

const hrStyle = {
  borderColor: "#2a2a2a",
  margin: "32px 0 24px",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {children}
          <Hr style={hrStyle} />
          <Text style={footerTextStyle}>
            Estudio de Tatuajes · Este es un email transaccional, por favor no respondas a este
            mensaje.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
