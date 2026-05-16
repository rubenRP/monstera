import { createClient } from '@supabase/supabase-js'
import { API_ERROR_CODES } from '#shared/utils/i18n/apiErrors'

export function getServiceSupabase() {
  const config = useRuntimeConfig()
  const url = process.env.SUPABASE_URL
  const key = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throwApiError(500, API_ERROR_CODES.SUPABASE_NOT_CONFIGURED)
  }
  return createClient(url, key)
}
