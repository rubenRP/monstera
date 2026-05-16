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

export function pickBestPerenualMatch(
  items: PerenualSpeciesListItem[],
  speciesQuery: string
): PerenualSpeciesListItem | null {
  if (!items.length) return null

  const scored = items
    .map(item => ({ item, score: scorePerenualMatch(item, speciesQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length) return scored[0]!.item

  const qWords = speciesQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (qWords.length >= 2 && items.length) {
    const genusMatch = items.find((item) => {
      const genus = (item.genus ?? '').toLowerCase()
      const scientific = (item.scientific_name ?? []).join(' ').toLowerCase()
      return genus === qWords[0] || scientific.startsWith(`${qWords[0]} `)
    })
    if (genusMatch) return genusMatch
  }

  return items[0] ?? null
}
