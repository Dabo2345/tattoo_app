import { Heading, Section, Text } from "@react-email/components"
import type { ReminderPayload } from "@/modules/notification/types"
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

const urgentSectionStyle = {
  backgroundColor: "#1f1212",
  border: "1px solid #3f1515",
  borderRadius: "6px",
  padding: "16px 20px",
  marginBottom: "24px",
}

const urgentTextStyle = {
  color: "#fca5a5",
  fontSize: "14px",
  fontWeight: "500",
  lineHeight: "1.5",
  margin: "0",
}

const closingStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Reminder2hEmail({ clientName, appointmentDate, appointmentTime }: ReminderPayload) {
  return (
    <BaseLayout preview={`¡En 2 horas! Tu cita de hoy — ${appointmentTime}`}>
      <Heading style={headingStyle}>Tu cita es en 2 horas</Heading>
      <Text style={subtitleStyle}>Hola {clientName}, tu cita de hoy comienza pronto.</Text>

      <Section style={detailSectionStyle}>
        <Text style={labelStyle}>Fecha</Text>
        <Text style={valueStyle}>{appointmentDate}</Text>

        <Text style={labelStyle}>Hora</Text>
        <Text style={valueLastStyle}>{appointmentTime}</Text>
      </Section>

      <Section style={urgentSectionStyle}>
        <Text style={urgentTextStyle}>
          Recuerda llegar puntual o con unos minutos de antelación. Si tienes algún imprevisto,
          avisa al estudio lo antes posible.
        </Text>
      </Section>

      <Text style={closingStyle}>¡Nos vemos pronto!</Text>
    </BaseLayout>
  )
}
