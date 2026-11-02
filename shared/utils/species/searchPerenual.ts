import { getSpeciesSearchAliases } from '../../constants/speciesAliases'

export interface PerenualSpeciesListItem {
  id: number
  common_name?: string
  scientific_name?: string[]
  genus?: string
}

export function buildPerenualSearchQueries(speciesQuery: string): string[] {
  const normalized = speciesQuery.trim().toLowerCase().replace(/\s+/g, ' ')
  const words = normalized.split(' ').filter(Boolean)
  const queries = new Set<string>()

  if (normalized) queries.add(normalized)
  if (words.length > 1) queries.add(words[0]!)
  if (words.length > 2) queries.add(words.slice(0, 2).join(' '))
  for (const alias of getSpeciesSearchAliases(normalized)) {
    queries.add(alias)
  }

  return [...queries]
}

export function scorePerenualMatch(item: PerenualSpeciesListItem, speciesQuery: string): number {
  const q = speciesQuery.trim().toLowerCase()
  const qWords = q.split(/\s+/).filter(Boolean)
  const scientific = (item.scientific_name ?? []).join(' ').toLowerCase()
  const common = (item.common_name ?? '').toLowerCase()
  const genus = (item.genus ?? '').toLowerCase()

  let score = 0

  if (scientific === q) score += 200
  if (common === q) score += 150
  if (scientific.includes(q)) score += 80
  if (common.includes(q)) score += 40

  for (const word of qWords) {
    if (scientific.includes(word)) score += 25
    if (common.includes(word)) score += 10
    if (genus === word) score += 15
  }

  return score
}

/**
 * For a binomial query ("ficus nitida") the species itself must match. Sharing only the genus
 * is not enough: searching "ficus" returns Ficus carica, which must not stand in for
 * Ficus nitida (different care, light and toxicity data).
 */
function matchesSpecies(item: PerenualSpeciesListItem, speciesQuery: string): boolean {
  const q = speciesQuery.trim().toLowerCase().replace(/\s+/g, ' ')
  const binomial = q.split(' ').slice(0, 2).join(' ')
  const scientific = (item.scientific_name ?? []).join(' ').toLowerCase()
  const common = (item.common_name ?? '').toLowerCase()
  return scientific.includes(binomial) || common.includes(q)
}

export function pickBestPerenualMatch(
  items: PerenualSpeciesListItem[],
  speciesQuery: string
): PerenualSpeciesListItem | null {
  if (!items.length) return null

  const isBinomial = speciesQuery.trim().split(/\s+/).filter(Boolean).length >= 2
  if (isBinomial) {
    const species = items
      .filter(item => matchesSpecies(item, speciesQuery))
      .map(item => ({ item, score: scorePerenualMatch(item, speciesQuery) }))
      .sort((a, b) => b.score - a.score)
    // No species-level match: let the caller try the next query, then fall back to generating the profile.
    return species[0]?.item ?? null
  }

  const scored = items
    .map(item => ({ item, score: scorePerenualMatch(item, speciesQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length) return scored[0]!.item

  // Single-word query (genus or common name): the first result is a reasonable fallback.
  return items[0] ?? null
}
