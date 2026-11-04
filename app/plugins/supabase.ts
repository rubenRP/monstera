import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Ref } from 'vue'

/**
 * Supabase client authenticated with the Clerk session token (Supabase
 * third-party auth). RLS policies read the Clerk user id from `auth.jwt()->>'sub'`.
 * Without a session (signed out, SSR) the token is `null` and requests are anonymous.
 */
export default defineNuxtPlugin((nuxtApp): { provide: { supabase: SupabaseClient } } => {
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
  const { getToken }: { getToken: Readonly<Ref<() => Promise<string | null>>> } = nuxtApp.vueApp.runWithContext(() => useAuth())

  const client: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    accessToken: async (): Promise<string | null> => {
      if (!import.meta.client) return null
      return (await getToken.value()) ?? null
    }
  })

  return { provide: { supabase: client } }
})
