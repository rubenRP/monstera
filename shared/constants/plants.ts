import type { HealthStatus, PotMaterial, PotSize, SubstrateType } from '../types/database'

export const HEALTH_STATUS_OPTIONS: { value: HealthStatus, color: string }[] = [
  { value: 'healthy', color: 'bg-emerald-500' },
  { value: 'fair', color: 'bg-amber-500' },
  { value: 'sick', color: 'bg-orange-500' },
  { value: 'critical', color: 'bg-red-600' }
]

export const POT_MATERIAL_OPTIONS: { value: PotMaterial }[] = [
  { value: 'terracotta' },
  { value: 'plastic' },
  { value: 'ceramic' },
  { value: 'metal' },
  { value: 'other' }
]

export const POT_SIZE_OPTIONS: { value: PotSize }[] = [
  { value: 'xs' },
  { value: 's' },
  { value: 'm' },
  { value: 'l' },
  { value: 'xl' }
]

export const SUBSTRATE_OPTIONS: { value: SubstrateType }[] = [
  { value: 'universal' },
  { value: 'cactus_succulent' },
  { value: 'orchid' },
  { value: 'acid_loving' },
  { value: 'coco_coir' },
  { value: 'peat' },
  { value: 'other' }
]

export const HEALTH_STATUS_ORDER: Record<HealthStatus, number> = {
  critical: 0,
  sick: 1,
  fair: 2,
  healthy: 3
}

export function getHealthColor(status: HealthStatus): string {
  return HEALTH_STATUS_OPTIONS.find(o => o.value === status)?.color ?? 'bg-gray-400'
}
