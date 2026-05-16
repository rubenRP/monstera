/** Extra Perenual search terms for normalized species queries (lowercase). */
const SPECIES_SEARCH_ALIASES: Record<string, string[]> = {
  'howea forsteriana': ['kentia palm', 'kentia'],
  'howea belmoreana': ['kentia palm', 'kentia'],
  'chamaedorea elegans': ['parlor palm', 'neanthe bella palm'],
  'dypsis lutescens': ['areca palm', 'butterfly palm'],
  'beaucarnea recurvata': ['ponytail palm'],
  'sansevieria trifasciata': ['snake plant', 'mother in law tongue'],
  'epipremnum aureum': ['pothos', 'devils ivy'],
  'monstera deliciosa': ['swiss cheese plant'],
  'spathiphyllum': ['peace lily'],
  'zamioculcas zamiifolia': ['zz plant']
}

export function getSpeciesSearchAliases(normalizedQuery: string): string[] {
  return SPECIES_SEARCH_ALIASES[normalizedQuery] ?? []
}
