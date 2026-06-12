import { Button, Heading, Section, Text } from "@react-email/components"
import type { MagicLinkSentPayload } from "@/modules/notification/types"
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

const warningStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MagicLinkEmail({ clientName, magicLinkUrl, expiresInHours }: MagicLinkSentPayload) {
  return (
    <BaseLayout preview={`Tu enlace de gestión de cita — válido ${expiresInHours}h`}>
      <Heading style={headingStyle}>Enlace de gestión de cita</Heading>
      <Text style={subtitleStyle}>
        Hola {clientName}, aquí tienes tu enlace para gestionar tu cita.
      </Text>

      <Section style={infoSectionStyle}>
        <Text style={labelStyle}>Válido durante</Text>
        <Text style={valueStyle}>{expiresInHours} horas desde que recibiste este email</Text>
      </Section>

      <Section style={buttonSectionStyle}>
        <Button href={magicLinkUrl} style={buttonStyle}>
          Gestionar mi cita
        </Button>
      </Section>

      <Text style={warningStyle}>
        Este enlace es de un solo uso y caduca en {expiresInHours} horas. No lo compartas con nadie.
        Con él puedes ver tu cita, reprogramarla o cancelarla.
      </Text>
    </BaseLayout>
  )
}
