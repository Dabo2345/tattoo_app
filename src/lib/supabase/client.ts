import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

/**
 * Cliente de Supabase con Service Role Key.
 * SOLO para uso en el servidor (Server Actions, Route Handlers).
 * NUNCA exportar al cliente.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
