import { Button, Heading, Section, Text } from "@react-email/components"
import type { ConsultationConfirmedPayload } from "@/modules/notification/types"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeposit(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConsultationConfirmedEmail({
  clientName,
  appointmentDate,
  appointmentTime,
  depositAmount,
  magicLinkUrl,
}: ConsultationConfirmedPayload) {
  return (
    <BaseLayout preview={`Confirmación de consulta — ${appointmentDate} a las ${appointmentTime}`}>
      <Heading style={headingStyle}>Tu consulta está confirmada</Heading>
      <Text style={subtitleStyle}>
        Hola {clientName}, hemos recibido tu depósito y tu cita está reservada.
      </Text>

      <Section style={detailSectionStyle}>
        <Text style={labelStyle}>Fecha</Text>
        <Text style={valueStyle}>{appointmentDate}</Text>

        <Text style={labelStyle}>Hora</Text>
        <Text style={valueStyle}>{appointmentTime}</Text>

        <Text style={labelStyle}>Depósito pagado</Text>
        <Text style={valueLastStyle}>{formatDeposit(depositAmount)}</Text>
      </Section>

      <Section style={buttonSectionStyle}>
        <Button href={magicLinkUrl} style={buttonStyle}>
          Gestionar mi cita
        </Button>
      </Section>

      <Text style={noteStyle}>
        Con este enlace puedes ver los detalles de tu cita, reprogramarla o cancelarla.
      </Text>
    </BaseLayout>
  )
}
