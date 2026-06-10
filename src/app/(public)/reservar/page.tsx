import type { Metadata } from "next"
import { BookingWizard } from "@/modules/booking/components/booking-wizard"

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Reservar Consulta",
  description:
    "Reserva tu consulta gratuita en el estudio. Elige fecha, horario e introduce tus datos.",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservarPage() {
  return (
    <section aria-labelledby="reservar-heading" className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <div className="mb-10">
        <h1 id="reservar-heading" className="text-h1 text-foreground mb-2">
          Reservar consulta
        </h1>
        <p className="text-body text-foreground-secondary">
          La consulta es gratuita y sin compromiso. Te explicamos el proceso y resolvemos tus dudas
          antes de empezar.
        </p>
      </div>

      <BookingWizard />
    </section>
  )
}
