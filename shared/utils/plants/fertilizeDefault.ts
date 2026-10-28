/** Fallback when the species gives no hint. */
export const DEFAULT_FERTILIZE_DAYS = 30

/**
 * Rough liquid-fertilizer interval from Perenual's watering category: thirsty, fast-growing
 * plants feed more often; succulents and cacti rarely.
 */
export function suggestFertilizeDays(watering: string | null | undefined): number {
  const value = watering?.toLowerCase().trim()
  if (value === 'frequent') return 14
  if (value === 'minimum' || value === 'none') return 60
  return DEFAULT_FERTILIZE_DAYS
}
