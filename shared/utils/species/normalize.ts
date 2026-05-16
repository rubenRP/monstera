export function normalizeSpeciesQuery(species: string): string {
  return species.trim().toLowerCase().replace(/\s+/g, ' ')
}
