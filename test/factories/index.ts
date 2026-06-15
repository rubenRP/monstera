import type { CareTask, CareTaskStatus, CareTaskType, Plant, Site } from '#shared/types/database'

const DEFAULT_USER_ID = 'test-user-id'

export function createSite(overrides: Partial<Site> = {}): Site {
  return {
    id: 'site-1',
    user_id: DEFAULT_USER_ID,
    name: 'Salón',
    placement: 'indoor',
    window_orientation: 'S',
    luminosity: 'medium',
    has_ceiling_cover: false,
    notes: '',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

export function createPlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'plant-1',
    user_id: DEFAULT_USER_ID,
    name: 'Monstera',
    species: 'Monstera deliciosa',
    photo_path: null,
    notes: '',
    health_status: 'healthy',
    health_status_note: null,
    health_status_updated_at: null,
    watering_base_interval_days: 7,
    watering_interval_days: 7,
    fertilizing_interval_days: 30,
    last_watered_at: null,
    last_fertilized_at: null,
    check_in_interval_days: 14,
    last_check_in_at: null,
    site_id: 'site-1',
    site: createSite(),
    window_distance_cm: null,
    pot_size: 'm',
    pot_diameter_cm: null,
    pot_material: 'terracotta',
    has_drainage: true,
    substrate_type: 'universal',
    substrate_notes: null,
    height_cm: null,
    height_updated_at: null,
    age_years: null,
    age_unit: null,
    archived_at: null,
    archive_reason: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

export function createCareTask(
  overrides: Partial<CareTask> & {
    type?: CareTaskType
    status?: CareTaskStatus
  } = {}
): CareTask {
  const plant = overrides.plant ?? {
    id: 'plant-1',
    name: 'Monstera',
    photo_path: null,
    health_status: 'healthy' as const,
    archived_at: null,
    site_id: 'site-1',
    site: { id: 'site-1', name: 'Salón' }
  }

  return {
    id: 'task-1',
    plant_id: plant.id,
    user_id: DEFAULT_USER_ID,
    type: 'water',
    due_at: '2026-06-15T10:00:00Z',
    completed_at: null,
    status: 'pending',
    skip_reason: null,
    created_at: '2026-06-15T10:00:00Z',
    plant,
    ...overrides
  }
}

export { DEFAULT_USER_ID }
