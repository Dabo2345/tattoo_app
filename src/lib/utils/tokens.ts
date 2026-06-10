import crypto from "crypto"

/**
 * Genera un token criptográficamente seguro de 32 bytes (64 chars hex).
 * Se envía al cliente en la URL (magic link, session link).
 * NUNCA almacenar este valor en la base de datos — usar hashToken().
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Calcula el hash SHA-256 de un token en formato hex.
 * Es el único valor que se almacena en la base de datos.
 * La búsqueda de tokens siempre se hace por hash, nunca por valor original.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}
