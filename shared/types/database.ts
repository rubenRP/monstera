export type Placement = 'indoor' | 'outdoor' | 'semi_outdoor'
export type WindowOrientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
export type Luminosity = 'low' | 'medium' | 'high' | 'direct_sun'
export type PotSize = 'xs' | 's' | 'm' | 'l' | 'xl'
export type PotMaterial = 'terracotta' | 'plastic' | 'ceramic' | 'metal' | 'other'
export type SubstrateType =
  | 'universal'
  | 'cactus_succulent'
  | 'orchid'
  | 'acid_loving'
  | 'coco_coir'
  | 'peat'
  | 'other'
export type HealthStatus = 'healthy' | 'fair' | 'sick' | 'critical'
export type CareTaskType = 'water' | 'fertilize'
export type CareTaskStatus = 'pending' | 'done' | 'skipped'

export interface Site {
  id: string
  user_id: string
  name: string
  placement: Placement
  window_orientation: WindowOrientation | null
  luminosity: Luminosity | null
  has_ceiling_cover: boolean
  notes: string
  created_at: string
  updated_at: string
  plants?: Pick<Plant, 'id' | 'name' | 'health_status' | 'photo_path'>[]
}

export interface Plant {
  id: string
  user_id: string
  name: string
  species: string | null
  photo_path: string | null
  notes: string
  health_status: HealthStatus
  health_status_note: string | null
  health_status_updated_at: string | null
  watering_interval_days: number
  fertilizing_interval_days: number
  last_watered_at: string | null
  last_fertilized_at: string | null
  site_id: string | null
  site?: Site | null
  window_distance_cm: number | null
  pot_size: PotSize | null
  pot_diameter_cm: number | null
  pot_material: PotMaterial | null
  has_drainage: boolean
  substrate_type: SubstrateType | null
  substrate_notes: string | null
  height_cm: number | null
  height_updated_at: string | null
  age_years: number | null
  created_at: string
  updated_at: string
}

export interface CareTask {
  id: string
  plant_id: string
  user_id: string
  type: CareTaskType
  due_at: string
  completed_at: string | null
  status: CareTaskStatus
  created_at: string
  plant?: Pick<Plant, 'id' | 'name' | 'photo_path' | 'health_status' | 'site_id'> & {
    site?: Pick<Site, 'id' | 'name'> | null
  }
}

export interface Diagnosis {
  id: string
  plant_id: string
  user_id: string
  symptoms: string
  image_path: string | null
  ai_summary: string | null
  ai_raw: Record<string, unknown> | null
  suggested_health_status: HealthStatus | null
  created_at: string
}

export interface UserSettings {
  user_id: string
  home_lat: number | null
  home_lon: number | null
  created_at: string
  updated_at: string
}
