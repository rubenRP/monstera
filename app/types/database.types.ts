export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      plants: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
      care_tasks: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
      diagnoses: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
      user_settings: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
      push_subscriptions: { Row: Record<string, unknown>, Insert: Record<string, unknown>, Update: Record<string, unknown> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
