import type { StudioInfo } from "../types"

/**
 * Datos estáticos del estudio.
 * Reemplazado por persistencia en BD en issue #044.
 */
export const studioInfo: StudioInfo = {
  name: "Tattoo Studio",
  tagline: "Un espacio diseñado para que tu experiencia sea única",
  description:
    "Nuestro estudio es un espacio íntimo y profesional donde el arte y la higiene son lo primero. Cada cita es una experiencia privada: sin prisas, sin interrupciones, con toda la atención puesta en tu tatuaje.",
  address: "Calle Mayor 42, Local 3",
  city: "Madrid, 28013",
  phone: "+34 600 000 000",
  email: "info@tattoostudio.com",
  workingHours: [
    { day: "Lunes", hours: "Cerrado" },
    { day: "Martes – Viernes", hours: "11:00 – 20:00" },
    { day: "Sábado", hours: "10:00 – 18:00" },
    { day: "Domingo", hours: "Cerrado" },
  ],
  parkingInfo: "Parking público a 200m (Calle Menor 8)",
  accessibilityInfo: "Local accesible en silla de ruedas",
  hygieneInfo:
    "Trabajamos con material de un solo uso, esterilización en autoclave y superficies desinfectadas entre cada cliente. Cumplimos con toda la normativa sanitaria vigente.",
}
