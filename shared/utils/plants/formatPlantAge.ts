import type { PlantAgeUnit } from '../../types/database'

export function formatPlantAge(
  amount: number,
  unit: PlantAgeUnit,
  t: (key: string, params?: Record<string, unknown>) => string
): string {
  if (unit === 'months') {
    return t('plants.ageValueMonths', { count: amount })
  }
  return t('plants.ageValue', { count: amount })
}

export function defaultPlantAgeUnit(
  amount: number | null | undefined,
  unit: PlantAgeUnit | null | undefined
): PlantAgeUnit {
  if (unit === 'months' || unit === 'years') return unit
  return 'years'
}
