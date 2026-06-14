import { Button, Heading, Section, Text } from "@react-email/components"
import type { SessionLinkSentPayload } from "@/modules/notification/types"
import { BaseLayout } from "./base-layout"

// ─── Styles ───────────────────────────────────────────────────────────────────

const headingStyle = {
  color: "#f9fafb",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 8px",
}

const subtitleStyle = {
  color: "#9ca3af",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 32px",
}

const infoSectionStyle = {
  backgroundColor: "#1f1f1f",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  padding: "20px 24px",
  marginBottom: "24px",
}

const labelStyle = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
}

const valueStyle = {
  color: "#f9fafb",
  fontSize: "15px",
  fontWeight: "500",
  lineHeight: "1.4",
  margin: "0",
}

const notesSectionStyle = {
  backgroundColor: "#1f1f1f",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  padding: "20px 24px",
  marginBottom: "24px",
}

const notesTitleStyle = {
  color: "#f9fafb",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const notesTextStyle = {
  color: "#d1d5db",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
}

const buttonStyle = {
  backgroundColor: "#B91C1C",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
}

const buttonSectionStyle = {
  textAlign: "center" as const,
  margin: "0 0 24px",
}

const noteStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionLinkEmail({
  clientName,
  sessionLinkUrl,
  expiresInHours,
  artistNotes,
}: SessionLinkSentPayload) {
  const expiryDays = Math.round(expiresInHours / 24)

  return (
    <BaseLayout preview={`Reserva tu sesión de tatuaje — enlace válido ${expiryDays} días`}>
      <Heading style={headingStyle}>Tu enlace para reservar sesión</Heading>
      <Text style={subtitleStyle}>
        Hola {clientName}, el artista ha preparado un enlace exclusivo para que reserves tu sesión
        de tatuaje.
      </Text>

      <Section style={infoSectionStyle}>
        <Text style={labelStyle}>Enlace válido durante</Text>
        <Text style={valueStyle}>{expiryDays} días</Text>
      </Section>

      {artistNotes && (
        <Section style={notesSectionStyle}>
          <Text style={notesTitleStyle}>Notas del artista</Text>
          <Text style={notesTextStyle}>{artistNotes}</Text>
        </Section>
      )}

      <Section style={buttonSectionStyle}>
        <Button href={sessionLinkUrl} style={buttonStyle}>
          Reservar mi sesión
        </Button>
      </Section>

      <Text style={noteStyle}>
        Este enlace es personal e intransferible. Úsalo para elegir fecha y hora de tu sesión.
        Caduca en {expiryDays} días.
      </Text>
    </BaseLayout>
  )
}
