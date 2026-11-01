import type { SupabaseClient } from '@supabase/supabase-js'

/** Supabase client authenticated with the Clerk session token (see `app/plugins/supabase.ts`). */
export function useSupabaseClient(): SupabaseClient {
  return useNuxtApp().$supabase as SupabaseClient
}
