export interface TimeSlot {
  startsAt: string
  endsAt: string
}

/**
 * Fetcha slots disponibles desde GET /api/availability.
 * Devuelve array de slots para el rango [from, to].
 */
export const bookingApi = {
  async getAvailability(from: Date, to: Date): Promise<TimeSlot[]> {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      type: "consultation",
    })
    const res = await fetch(`/api/availability?${params.toString()}`)
    if (!res.ok) throw new Error("Error al obtener disponibilidad")
    const data = await res.json()
    return data.data as TimeSlot[]
  },
}
