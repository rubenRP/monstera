import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client authenticated with the Clerk session token (Supabase
 * third-party auth). RLS policies read the Clerk user id from `auth.jwt()->>'sub'`.
 * Without a session (signed out, SSR) the token is `null` and requests are anonymous.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  const { getToken } = nuxtApp.vueApp.runWithContext(() => useAuth())

  const client = createClient(supabaseUrl, supabaseKey, {
    accessToken: async () => {
      if (!import.meta.client) return null
      return (await getToken.value()) ?? null
    }
  })

  return { provide: { supabase: client } }
})
