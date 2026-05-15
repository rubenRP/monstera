import type { HealthStatus, Plant } from '#shared/types/database'
import { HEALTH_STATUS_ORDER } from '#shared/constants/plants'
import { generateCareTasks } from '#shared/utils/care/generateTasks'
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const PLANT_SELECT = '*, site:sites(*)'

export function usePlants() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchPlants(filterStatus?: HealthStatus | 'all') {
    let query = supabase
      .from('plants')
      .select(PLANT_SELECT)
      .order('name')

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('health_status', filterStatus)
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
    const uid = user.value?.id
    if (!uid) throw new Error('No autenticado')
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
    const uid = user.value?.id
    if (!uid) throw new Error('No autenticado')

    const payload = sanitizePlantPayload(form)

    const { data: plant, error } = await supabase
      .from('plants')
      .insert({ ...payload, user_id: uid })
      .select(PLANT_SELECT)
      .single()
    if (error) throw error

    if (photoFile) {
      const photoPath = await uploadPhoto(photoFile, plant.id)
      await supabase.from('plants').update({ photo_path: photoPath }).eq('id', plant.id)
      plant.photo_path = photoPath
    }

    await regenerateTasks(plant.id, plant as Plant)
    return plant as Plant
  }

  async function updatePlant(id: string, form: PlantFormInput, photoFile?: File) {
    const payload = sanitizePlantPayload(form)
    if (photoFile) {
      payload.photo_path = await uploadPhoto(photoFile, id)
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

    await supabase
      .from('care_tasks')
      .delete()
      .eq('plant_id', id)
      .eq('status', 'pending')

    await regenerateTasks(id, plant as Plant)
    return plant as Plant
  }

  async function updateHealthStatus(id: string, status: HealthStatus, note?: string | null) {
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

  async function regenerateTasks(plantId: string, plant: Plant) {
    const uid = user.value?.id
    if (!uid) return

    const tasks = generateCareTasks(
      plant.watering_interval_days,
      plant.fertilizing_interval_days,
      plant.last_watered_at ? new Date(plant.last_watered_at) : null,
      plant.last_fertilized_at ? new Date(plant.last_fertilized_at) : null
    )

    if (!tasks.length) return

    const { error } = await supabase.from('care_tasks').insert(
      tasks.map(t => ({
        plant_id: plantId,
        user_id: uid,
        type: t.type,
        due_at: t.due_at,
        status: 'pending' as const
      }))
    )
    if (error) throw error
  }

  function sanitizePlantPayload(form: PlantFormInput) {
    return {
      name: form.name,
      species: form.species || null,
      notes: form.notes ?? '',
      health_status: form.health_status,
      health_status_note: form.health_status_note || null,
      watering_interval_days: form.watering_interval_days,
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
      age_years: form.age_years ?? null
    }
  }

  return {
    fetchPlants,
    fetchPlant,
    createPlant,
    updatePlant,
    updateHealthStatus,
    deletePlant,
    uploadPhoto,
    getSignedPhotoUrl,
    regenerateTasks
  }
}
