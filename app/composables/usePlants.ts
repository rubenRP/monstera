import type { HealthStatus, Plant, PlantArchiveReason } from '#shared/types/database'
import { HEALTH_STATUS_ORDER } from '#shared/constants/plants'
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const PLANT_SELECT = '*, site:sites(*)'

export function usePlants() {
  const supabase = useSupabaseClient()
  const { requireUserId } = useRequireUserId()
  const { rescheduleWatering } = useAdaptiveWatering()

  type FetchPlantsOptions = {
    filterStatus?: HealthStatus | 'all'
    archived?: 'active' | 'archived'
  }

  async function fetchPlants(options?: FetchPlantsOptions | HealthStatus | 'all') {
    const opts: FetchPlantsOptions = typeof options === 'string' || options === undefined
      ? { filterStatus: options, archived: 'active' }
      : { archived: 'active', ...options }

    let query = supabase
      .from('plants')
      .select(PLANT_SELECT)
      .order('name')

    if (opts.archived === 'archived') {
      query = query.not('archived_at', 'is', null)
    } else {
      query = query.is('archived_at', null)
    }

    if (opts.filterStatus && opts.filterStatus !== 'all') {
      query = query.eq('health_status', opts.filterStatus)
    }

    const { data, error } = await query
    if (error) throw error

    const plants = (data ?? []) as Plant[]
    return plants.sort(
      (a, b) => HEALTH_STATUS_ORDER[a.health_status] - HEALTH_STATUS_ORDER[b.health_status]
    )
  }

  async function fetchPlant(id: string) {
    const { data, error } = await supabase
      .from('plants')
      .select(PLANT_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Plant
  }

  async function uploadPhoto(file: File, plantId: string): Promise<string> {
    const uid = await requireUserId()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${uid}/${plantId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('plant-photos').upload(path, file, {
      upsert: true,
      contentType: file.type
    })
    if (error) throw error
    return path
  }

  async function getSignedPhotoUrl(path: string) {
    const { data, error } = await supabase.storage
      .from('plant-photos')
      .createSignedUrl(path, 3600)
    if (error) throw error
    return data.signedUrl
  }

  async function createPlant(form: PlantFormInput, photoFile?: File) {
    const uid = await requireUserId()

    const payload = sanitizePlantPayload(form)

    const { data, error } = await supabase
      .from('plants')
      .insert({ ...payload, user_id: uid })
      .select(PLANT_SELECT)
      .single()
    if (error || !data) throw error
    const plant = data as Plant

    if (photoFile) {
      const photoPath = await uploadPhoto(photoFile, plant.id)
      await supabase.from('plants').update({ photo_path: photoPath }).eq('id', plant.id)
      plant.photo_path = photoPath
    }

    await regenerateTasks(plant.id, plant)
    return plant
  }

  async function archivePlant(id: string, reason: PlantArchiveReason) {
    const now = new Date().toISOString()
    const { error: plantError } = await supabase
      .from('plants')
      .update({
        archived_at: now,
        archive_reason: reason,
        updated_at: now
      })
      .eq('id', id)
      .is('archived_at', null)
    if (plantError) throw plantError

    const { error: taskError } = await supabase
      .from('care_tasks')
      .update({ status: 'skipped', completed_at: now })
      .eq('plant_id', id)
      .eq('status', 'pending')
    if (taskError) throw taskError
  }

  async function updatePlant(id: string, form: PlantFormInput, photoFile?: File) {
    const { data: existing, error: fetchError } = await supabase
      .from('plants')
      .select('archived_at')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError
    if (existing?.archived_at) {
      throw new Error('PLANT_ARCHIVED')
    }

    const payload = {
      ...sanitizePlantPayload(form),
      ...(photoFile ? { photo_path: await uploadPhoto(photoFile, id) } : {})
    }

    const { data: plant, error } = await supabase
      .from('plants')
      .update({
        ...payload,
        health_status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(PLANT_SELECT)
      .single()
    if (error) throw error

    const { error: delFertError } = await supabase
      .from('care_tasks')
      .delete()
      .eq('plant_id', id)
      .eq('status', 'pending')
      .eq('type', 'fertilize')
    if (delFertError) throw delFertError

    await regenerateTasks(id, plant as Plant)
    return plant as Plant
  }

  async function updateHealthStatus(id: string, status: HealthStatus, note?: string | null) {
    const { data: existing, error: fetchError } = await supabase
      .from('plants')
      .select('archived_at')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError
    if (existing?.archived_at) {
      throw new Error('PLANT_ARCHIVED')
    }

    const { error } = await supabase
      .from('plants')
      .update({
        health_status: status,
        health_status_note: note ?? null,
        health_status_updated_at: new Date().toISOString()
      })
      .eq('id', id)
    if (error) throw error
  }

  async function deletePlant(id: string) {
    const { error } = await supabase.from('plants').delete().eq('id', id)
    if (error) throw error
  }

  async function regenerateTasks(plantId: string, _plant: Plant) {
    await rescheduleWatering(plantId)
  }

  function sanitizePlantPayload(form: PlantFormInput) {
    const base = form.watering_base_interval_days
    return {
      name: form.name,
      species: form.species || null,
      notes: form.notes ?? '',
      health_status: form.health_status,
      health_status_note: form.health_status_note || null,
      watering_base_interval_days: base,
      watering_interval_days: base,
      fertilizing_interval_days: form.fertilizing_interval_days,
      site_id: form.site_id || null,
      window_distance_cm: form.window_distance_cm ?? null,
      pot_size: form.pot_size || null,
      pot_diameter_cm: form.pot_diameter_cm ?? null,
      pot_material: form.pot_material || null,
      has_drainage: form.has_drainage ?? false,
      substrate_type: form.substrate_type || null,
      substrate_notes: form.substrate_notes || null,
      height_cm: form.height_cm ?? null,
      height_updated_at: form.height_cm ? new Date().toISOString() : null,
      age_years: form.age_years ?? null,
      age_unit: form.age_years != null ? (form.age_unit ?? 'years') : null
    }
  }

  return {
    fetchPlants,
    fetchPlant,
    createPlant,
    updatePlant,
    updateHealthStatus,
    archivePlant,
    deletePlant,
    uploadPhoto,
    getSignedPhotoUrl,
    regenerateTasks
  }
}
