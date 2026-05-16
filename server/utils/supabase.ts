import { createClient } from '@supabase/supabase-js'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

export function getServiceSupabase() {
  const config = useRuntimeConfig()
  const url = process.env.SUPABASE_URL
    || process.env.NUXT_PUBLIC_SUPABASE_URL
    || (config.public as { supabaseUrl?: string }).supabaseUrl
  const key = config.supabaseServiceKey
    || process.env.NUXT_SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throwApiError(500, API_ERROR_CODES.SUPABASE_NOT_CONFIGURED)
  }
  return createClient(url, key)
}
