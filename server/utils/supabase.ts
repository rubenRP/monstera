import { createClient } from '@supabase/supabase-js'

export function getServiceSupabase() {
  const config = useRuntimeConfig()
  const url = process.env.SUPABASE_URL
  const key = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw createError({ statusCode: 500, message: 'Supabase no configurado en el servidor' })
  }
  return createClient(url, key)
}
