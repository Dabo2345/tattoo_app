import { Heading, Section, Text } from "@react-email/components"
import type { AppointmentCancelledPayload } from "@/modules/notification/types"
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

const refundSectionStyle = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #374151",
  borderRadius: "6px",
  padding: "20px 24px",
  marginBottom: "24px",
}

const refundTitleStyle = {
  color: "#f9fafb",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const refundTextStyle = {
  color: "#d1d5db",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
}

const noRefundTextStyle = {
  ...refundTextStyle,
  color: "#9ca3af",
}

const noteStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppointmentCancelledEmail({
  clientName,
  appointmentDate,
  refundAmount,
  refundDays,
}: AppointmentCancelledPayload) {
  const hasRefund = refundAmount > 0

  return (
    <BaseLayout preview={`Cita cancelada — ${appointmentDate}`}>
      <Heading style={headingStyle}>Tu cita ha sido cancelada</Heading>
      <Text style={subtitleStyle}>
        Hola {clientName}, tu cita ha quedado cancelada correctamente.
      </Text>

      <Section style={detailSectionStyle}>
        <Text style={labelStyle}>Fecha cancelada</Text>
        <Text style={valueLastStyle}>{appointmentDate}</Text>
      </Section>

      <Section style={refundSectionStyle}>
        <Text style={refundTitleStyle}>Política de depósito</Text>
        {hasRefund ? (
          <Text style={refundTextStyle}>
            Se realizará un reembolso de {formatAmount(refundAmount)} en un plazo de {refundDays}{" "}
            días hábiles en el método de pago original.
          </Text>
        ) : (
          <Text style={noRefundTextStyle}>
            De acuerdo con nuestra política de cancelación, el depósito abonado no será reembolsado.
            Las cancelaciones con menos de 4 días de antelación no tienen derecho a reembolso.
          </Text>
        )}
      </Section>

      <Text style={noteStyle}>
        Si tienes alguna pregunta, contacta directamente con el estudio.
      </Text>
    </BaseLayout>
  )
}
