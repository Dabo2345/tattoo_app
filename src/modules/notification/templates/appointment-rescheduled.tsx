import { Button, Heading, Section, Text } from "@react-email/components"
import type { AppointmentRescheduledPayload } from "@/modules/notification/types"
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

const detailSectionStyle = {
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
  margin: "0 0 16px",
}

const valueLastStyle = {
  ...valueStyle,
  margin: "0",
}

const oldDateStyle = {
  ...valueStyle,
  color: "#6b7280",
  textDecoration: "line-through",
  margin: "0 0 16px",
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

export function AppointmentRescheduledEmail({
  clientName,
  oldDate,
  newDate,
  newTime,
  magicLinkUrl,
}: AppointmentRescheduledPayload) {
  return (
    <BaseLayout preview={`Cita reprogramada — nueva fecha: ${newDate} a las ${newTime}`}>
      <Heading style={headingStyle}>Tu cita ha sido reprogramada</Heading>
      <Text style={subtitleStyle}>Hola {clientName}, los detalles de tu cita han cambiado.</Text>

      <Section style={detailSectionStyle}>
        <Text style={labelStyle}>Fecha anterior</Text>
        <Text style={oldDateStyle}>{oldDate}</Text>

        <Text style={labelStyle}>Nueva fecha</Text>
        <Text style={valueStyle}>{newDate}</Text>

        <Text style={labelStyle}>Nueva hora</Text>
        <Text style={valueLastStyle}>{newTime}</Text>
      </Section>

      <Section style={buttonSectionStyle}>
        <Button href={magicLinkUrl} style={buttonStyle}>
          Gestionar mi cita
        </Button>
      </Section>

      <Text style={noteStyle}>
        Con este enlace puedes ver los detalles actualizados, volver a reprogramar o cancelar.
      </Text>
    </BaseLayout>
  )
}
