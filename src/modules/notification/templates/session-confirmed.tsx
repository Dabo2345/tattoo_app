import { Heading, Section, Text } from "@react-email/components"
import type { SessionConfirmedPayload } from "@/modules/notification/types"
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

const notesSectionStyle = {
  ...detailSectionStyle,
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

const closingStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionConfirmedEmail({
  clientName,
  appointmentDate,
  appointmentTime,
  durationMinutes,
  artistNotes,
}: SessionConfirmedPayload) {
  return (
    <BaseLayout
      preview={`Sesión de tatuaje confirmada — ${appointmentDate} a las ${appointmentTime}`}
    >
      <Heading style={headingStyle}>Tu sesión está confirmada</Heading>
      <Text style={subtitleStyle}>
        Hola {clientName}, tu sesión de tatuaje ha quedado reservada correctamente.
      </Text>

      <Section style={detailSectionStyle}>
        <Text style={labelStyle}>Fecha</Text>
        <Text style={valueStyle}>{appointmentDate}</Text>

        <Text style={labelStyle}>Hora</Text>
        <Text style={valueStyle}>{appointmentTime}</Text>

        <Text style={labelStyle}>Duración estimada</Text>
        <Text style={valueLastStyle}>{formatDuration(durationMinutes)}</Text>
      </Section>

      {artistNotes && (
        <Section style={notesSectionStyle}>
          <Text style={notesTitleStyle}>Notas del artista</Text>
          <Text style={notesTextStyle}>{artistNotes}</Text>
        </Section>
      )}

      <Text style={closingStyle}>
        Si necesitas cambiar o cancelar tu cita, contacta directamente con el estudio.
      </Text>
    </BaseLayout>
  )
}
