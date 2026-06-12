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

const tipSectionStyle = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  padding: "16px 20px",
  marginBottom: "24px",
}

const tipTitleStyle = {
  color: "#f9fafb",
  fontSize: "13px",
  fontWeight: "600",
  margin: "0 0 6px",
}

const tipTextStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
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

export function Reminder24hEmail({
  clientName,
  appointmentDate,
  appointmentTime,
}: ReminderPayload) {
  return (
    <BaseLayout
      preview={`Recordatorio: tu cita es mañana — ${appointmentDate} a las ${appointmentTime}`}
    >
      <Heading style={headingStyle}>Tu cita es mañana</Heading>
      <Text style={subtitleStyle}>
        Hola {clientName}, te recordamos que tienes una cita confirmada mañana.
      </Text>

      <Section style={detailSectionStyle}>
        <Text style={labelStyle}>Fecha</Text>
        <Text style={valueStyle}>{appointmentDate}</Text>

        <Text style={labelStyle}>Hora</Text>
        <Text style={valueLastStyle}>{appointmentTime}</Text>
      </Section>

      <Section style={tipSectionStyle}>
        <Text style={tipTitleStyle}>Preparación para tu cita</Text>
        <Text style={tipTextStyle}>
          Descansa bien, hidrátate y evita el alcohol las 24h previas. Lleva ropa cómoda que permita
          acceder a la zona a tatuar.
        </Text>
      </Section>

      <Text style={closingStyle}>
        Si necesitas modificar o cancelar, contacta con el estudio con la mayor antelación posible.
      </Text>
    </BaseLayout>
  )
}
