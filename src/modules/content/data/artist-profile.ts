import type { ArtistProfile } from "../types"

/**
 * Datos estáticos del perfil del artista.
 * Reemplazado por persistencia en BD en issue #044.
 */
export const artistProfile: ArtistProfile = {
  name: "Alex Moreno",
  tagline: "Tatuador profesional con más de una década de experiencia",
  bio: "Mi trabajo nace de la convicción de que un tatuaje es una conversación entre el artista y la piel. Cada pieza que realizo está diseñada desde cero, pensada específicamente para la persona que la lleva y el cuerpo que la sostiene. No existen plantillas, no existe la repetición.",
  specialties: ["Blackwork", "Realismo", "Geometric", "Fine Line", "Dotwork"],
  experience: "12 años",
  photoUrl: null,
  instagram: "@alexmoreno.ink",
  location: "Madrid, España",
}
