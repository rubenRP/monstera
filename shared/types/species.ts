export interface SpeciesProfile {
  perenualId: number
  commonName: string
  scientificName: string[]
  imageUrl: string | null
  imageLicense: string | null
  watering: string
  light: string
  humidity: string
  fertilizing: string
  soil: string
  repotting: string
  toxicity: string
  characteristics: string
  temperature: string
  pestsAndProblems: string
  fetchedAt: string
  /** Set when missing care sections were filled via Cursor AI */
  enrichedByAi?: boolean
}

export interface SpeciesProfileRow {
  id: string
  species_query: string
  perenual_id: number
  profile: SpeciesProfile
  created_at: string
  updated_at: string
}
