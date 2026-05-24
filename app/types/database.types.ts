import type {
  AppLocale,
  CareTaskSkipReason,
  CareTaskStatus,
  CareTaskType,
  HealthStatus,
  Luminosity,
  PlantAgeUnit,
  PlantArchiveReason,
  Placement,
  PotMaterial,
  PotSize,
  SubstrateType,
  WindowOrientation
} from '../../shared/types/database'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      plants: {
        Row: {
          id: string
          user_id: string
          name: string
          species: string | null
          photo_path: string | null
          notes: string
          health_status: HealthStatus
          health_status_note: string | null
          health_status_updated_at: string | null
          watering_base_interval_days: number
          watering_interval_days: number
          fertilizing_interval_days: number
          last_watered_at: string | null
          last_fertilized_at: string | null
          site_id: string | null
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
          age_unit: PlantAgeUnit | null
          archived_at: string | null
          archive_reason: PlantArchiveReason | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          species?: string | null
          photo_path?: string | null
          notes?: string
          health_status?: HealthStatus
          health_status_note?: string | null
          health_status_updated_at?: string | null
          watering_base_interval_days?: number
          watering_interval_days?: number
          fertilizing_interval_days?: number
          last_watered_at?: string | null
          last_fertilized_at?: string | null
          site_id?: string | null
          window_distance_cm?: number | null
          pot_size?: PotSize | null
          pot_diameter_cm?: number | null
          pot_material?: PotMaterial | null
          has_drainage?: boolean
          substrate_type?: SubstrateType | null
          substrate_notes?: string | null
          height_cm?: number | null
          height_updated_at?: string | null
          age_years?: number | null
          age_unit?: PlantAgeUnit | null
          archived_at?: string | null
          archive_reason?: PlantArchiveReason | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          species?: string | null
          photo_path?: string | null
          notes?: string
          health_status?: HealthStatus
          health_status_note?: string | null
          health_status_updated_at?: string | null
          watering_base_interval_days?: number
          watering_interval_days?: number
          fertilizing_interval_days?: number
          last_watered_at?: string | null
          last_fertilized_at?: string | null
          site_id?: string | null
          window_distance_cm?: number | null
          pot_size?: PotSize | null
          pot_diameter_cm?: number | null
          pot_material?: PotMaterial | null
          has_drainage?: boolean
          substrate_type?: SubstrateType | null
          substrate_notes?: string | null
          height_cm?: number | null
          height_updated_at?: string | null
          age_years?: number | null
          age_unit?: PlantAgeUnit | null
          archived_at?: string | null
          archive_reason?: PlantArchiveReason | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_tasks: {
        Row: {
          id: string
          plant_id: string
          user_id: string
          type: CareTaskType
          due_at: string
          completed_at: string | null
          status: CareTaskStatus
          skip_reason: CareTaskSkipReason | null
          created_at: string
        }
        Insert: {
          id?: string
          plant_id: string
          user_id: string
          type: CareTaskType
          due_at: string
          completed_at?: string | null
          status?: CareTaskStatus
          skip_reason?: CareTaskSkipReason | null
          created_at?: string
        }
        Update: {
          id?: string
          plant_id?: string
          user_id?: string
          type?: CareTaskType
          due_at?: string
          completed_at?: string | null
          status?: CareTaskStatus
          skip_reason?: CareTaskSkipReason | null
          created_at?: string
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          id: string
          plant_id: string
          user_id: string
          symptoms: string
          image_path: string | null
          ai_summary: string | null
          ai_raw: Json | null
          suggested_health_status: HealthStatus | null
          created_at: string
        }
        Insert: {
          id?: string
          plant_id: string
          user_id: string
          symptoms: string
          image_path?: string | null
          ai_summary?: string | null
          ai_raw?: Json | null
          suggested_health_status?: HealthStatus | null
          created_at?: string
        }
        Update: {
          id?: string
          plant_id?: string
          user_id?: string
          symptoms?: string
          image_path?: string | null
          ai_summary?: string | null
          ai_raw?: Json | null
          suggested_health_status?: HealthStatus | null
          created_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          user_id: string
          home_lat: number | null
          home_lon: number | null
          locale: AppLocale
          push_reminder_time: string
          push_reminder_timezone: string
          push_reminder_last_sent_on: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          home_lat?: number | null
          home_lon?: number | null
          locale?: AppLocale
          push_reminder_time?: string
          push_reminder_timezone?: string
          push_reminder_last_sent_on?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          home_lat?: number | null
          home_lon?: number | null
          locale?: AppLocale
          push_reminder_time?: string
          push_reminder_timezone?: string
          push_reminder_last_sent_on?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
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
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          placement?: Placement
          window_orientation?: WindowOrientation | null
          luminosity?: Luminosity | null
          has_ceiling_cover?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          placement?: Placement
          window_orientation?: WindowOrientation | null
          luminosity?: Luminosity | null
          has_ceiling_cover?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      species_profiles: {
        Row: {
          id: string
          species_query: string
          perenual_id: number
          profile: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          species_query: string
          perenual_id: number
          profile: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          species_query?: string
          perenual_id?: number
          profile?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      placement_type: Placement
      window_orientation: WindowOrientation
      luminosity_level: Luminosity
      pot_size: PotSize
      pot_material: PotMaterial
      substrate_type: SubstrateType
      health_status: HealthStatus
      plant_archive_reason: PlantArchiveReason
      care_task_type: CareTaskType
      care_task_status: CareTaskStatus
    }
    CompositeTypes: Record<string, never>
  }
}
