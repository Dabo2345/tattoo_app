import Stripe from "stripe"
import { env } from "@/lib/env"

/**
 * Singleton del cliente Stripe.
 * SOLO para uso en el servidor (Route Handlers, Server Actions).
 * NUNCA importar en componentes de cliente. RA-004, AUTH-001.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY)
