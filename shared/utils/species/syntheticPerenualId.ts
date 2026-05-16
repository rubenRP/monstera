/** Stable negative id for AI-only profiles (avoids collision with Perenual positive ids). */
export function syntheticPerenualId(speciesQuery: string): number {
  let hash = 0
  for (let i = 0; i < speciesQuery.length; i++) {
    hash = (hash * 31 + speciesQuery.charCodeAt(i)) | 0
  }
  return -Math.abs(hash || 1)
}
