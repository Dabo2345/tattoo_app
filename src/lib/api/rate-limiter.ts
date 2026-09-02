/**
 * Rate limiter in-memory por clave (IP, etc.)
 * Ventana deslizante: cuenta peticiones dentro de windowMs milisegundos.
 * Limpieza lazy de entradas expiradas para evitar memory leaks.
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

export class InMemoryRateLimiter {
  private readonly store = new Map<string, RateLimitEntry>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  /**
   * Registra una petición para la clave dada.
   * @returns true si la petición está permitida, false si supera el límite.
   */
  check(key: string): boolean {
    const now = Date.now()
    this.evictExpired(now)

    const entry = this.store.get(key)

    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now })
      return true
    }

    if (entry.count >= this.limit) {
      return false
    }

    entry.count++
    return true
  }

  private evictExpired(now: number): void {
    for (const [key, entry] of this.store) {
      if (now - entry.windowStart >= this.windowMs) {
        this.store.delete(key)
      }
    }
  }
}
