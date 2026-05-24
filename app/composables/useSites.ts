import type { Site } from '#shared/types/database'
import type { SiteFormInput } from '#shared/utils/sites/schemas'

const SITE_SELECT = '*, plants(id, name, health_status, photo_path, archived_at)'

export function useSites() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchSites() {
    const { data, error } = await supabase
      .from('sites')
      .select(SITE_SELECT)
      .order('name')
    if (error) throw error
    return ((data ?? []) as Site[]).map(filterActiveSitePlants)
  }

  async function fetchSite(id: string) {
    const { data, error } = await supabase
      .from('sites')
      .select(SITE_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return filterActiveSitePlants(data as Site)
  }

  function filterActiveSitePlants(site: Site): Site {
    return {
      ...site,
      plants: site.plants?.filter(p => !p.archived_at)
    }
  }

  async function createSite(form: SiteFormInput) {
    const uid = user.value?.id
    if (!uid) throw new Error('No autenticado')
    const { data, error } = await supabase
      .from('sites')
      .insert({ ...form, user_id: uid })
      .select()
      .single()
    if (error) throw error
    return data as Site
  }

  async function updateSite(id: string, form: SiteFormInput) {
    const { data, error } = await supabase
      .from('sites')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Site
  }

  async function deleteSite(id: string) {
    const { error } = await supabase.from('sites').delete().eq('id', id)
    if (error) throw error
  }

  return {
    fetchSites,
    fetchSite,
    createSite,
    updateSite,
    deleteSite
  }
}
