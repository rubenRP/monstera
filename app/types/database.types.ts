export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      plants: {
        Row: {
          id: string
          user_id: string
          watering_base_interval_days: number
          watering_interval_days: number
          fertilizing_interval_days: number
          last_watered_at: string | null
          last_fertilized_at: string | null
          [key: string]: unknown
        }
        Insert: {
          user_id: string
          watering_base_interval_days?: number
          watering_interval_days?: number
          [key: string]: unknown
        }
        Update: {
          watering_base_interval_days?: number
          watering_interval_days?: number
          last_watered_at?: string | null
          [key: string]: unknown
        }
      }
      care_tasks: {
        Row: {
          id: string
          plant_id: string
          user_id: string
          type: string
          due_at: string
          status: string
          skip_reason: string | null
          completed_at: string | null
          [key: string]: unknown
        }
        Insert: {
          plant_id: string
          user_id: string
          type: string
          due_at: string
          status?: string
          skip_reason?: string | null
          completed_at?: string | null
        }
        Update: {
          status?: string
          skip_reason?: string | null
          completed_at?: string | null
        }
      }
      diagnoses: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
      user_settings: {
        Row: {
          user_id: string
          home_lat: number | null
          home_lon: number | null
          locale: string
          [key: string]: unknown
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
      sites: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
      species_profiles: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
      push_subscriptions: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
