import { Button, Heading, Hr, Section, Text } from "@react-email/components"
import { BaseLayout } from "./base-layout"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TattooPlanEmailProps {
  clientName: string
  artistName: string
  studioName: string
  plan: {
    style: string
    size: string
    placement: string
    description: string
    notes?: string
  }
  sessions: Array<{
    sessionNumber: number
    durationMinutes: number
    bookingUrl: string
    expiresAt: Date
  }>
}

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

const sectionStyle = {
  backgroundColor: "#1f1f1f",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  padding: "20px 24px",
  marginBottom: "24px",
}

const sectionTitleStyle = {
  color: "#f9fafb",
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
}

const labelStyle = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  margin: "0 0 2px",
  textTransform: "uppercase" as const,
}

const valueStyle = {
  color: "#f9fafb",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 12px",
}

const sessionSectionStyle = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "6px",
  padding: "16px 20px",
  marginBottom: "12px",
}

const sessionTitleStyle = {
  color: "#f9fafb",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
}

const sessionSubtitleStyle = {
  color: "#9ca3af",
  fontSize: "13px",
  margin: "0 0 12px",
}

const buttonStyle = {
  backgroundColor: "#B91C1C",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 20px",
  textDecoration: "none",
  textAlign: "center" as const,
}

const expireNoteStyle = {
  color: "#6b7280",
  fontSize: "11px",
  margin: "8px 0 0",
}

const sectionsDivStyle = {
  marginBottom: "24px",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} hora${h !== 1 ? "s" : ""}`
  return `${h}h ${m}min`
}

function formatExpiryDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TattooPlanEmail({ clientName, artistName, plan, sessions }: TattooPlanEmailProps) {
  const sessionCount = sessions.length
  const sessionLabel = sessionCount === 1 ? "1 sesión" : `${sessionCount} sesiones`

  return (
    <BaseLayout preview={`¡Tu plan de tatuaje está listo para reservar! ${sessionLabel}`}>
      <Heading style={headingStyle}>¡Tu plan de tatuaje está listo!</Heading>
      <Text style={subtitleStyle}>
        Hola {clientName}, {artistName} ha preparado tu plan de tatuaje. Aquí tienes todos los
        detalles y los enlaces para reservar cada sesión.
      </Text>

      {/* ── Características del tatuaje ───────────────────────── */}
      <Section style={sectionStyle}>
        <Text style={sectionTitleStyle}>Características del tatuaje</Text>

        <Text style={labelStyle}>Estilo</Text>
        <Text style={valueStyle}>{plan.style}</Text>

        <Text style={labelStyle}>Tamaño</Text>
        <Text style={valueStyle}>{plan.size}</Text>

        <Text style={labelStyle}>Placement</Text>
        <Text style={valueStyle}>{plan.placement}</Text>

        <Text style={labelStyle}>Descripción</Text>
        <Text style={{ ...valueStyle, margin: plan.notes ? "0 0 12px" : "0" }}>
          {plan.description}
        </Text>

        {plan.notes && (
          <>
            <Text style={labelStyle}>Notas del artista</Text>
            <Text style={{ ...valueStyle, margin: "0" }}>{plan.notes}</Text>
          </>
        )}
      </Section>

      {/* ── Sesiones ─────────────────────────────────────────── */}
      <Section style={sectionsDivStyle}>
        <Text style={sectionTitleStyle}>Tus sesiones — {sessionLabel}</Text>

        {sessions.map((session) => (
          <Section key={session.sessionNumber} style={sessionSectionStyle}>
            <Text style={sessionTitleStyle}>Sesión {session.sessionNumber}</Text>
            <Text style={sessionSubtitleStyle}>{formatDuration(session.durationMinutes)}</Text>
            <Button href={session.bookingUrl} style={buttonStyle}>
              Reservar sesión {session.sessionNumber}
            </Button>
            <Text style={expireNoteStyle}>
              Enlace válido hasta el {formatExpiryDate(session.expiresAt)}
            </Text>
          </Section>
        ))}
      </Section>

      <Hr style={{ borderColor: "#2a2a2a", margin: "0 0 16px" }} />
      <Text style={{ color: "#6b7280", fontSize: "13px", lineHeight: "1.6", margin: "0" }}>
        Cada enlace es personal e intransferible. Úsalo para elegir la fecha y hora de cada sesión.
      </Text>
    </BaseLayout>
  )
}
