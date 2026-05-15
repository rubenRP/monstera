import type { HealthStatus, PotMaterial, PotSize, SubstrateType } from '../types/database'

export const HEALTH_STATUS_OPTIONS: { value: HealthStatus, label: string, color: string }[] = [
  { value: 'healthy', label: 'Bien', color: 'bg-emerald-500' },
  { value: 'fair', label: 'Regular', color: 'bg-amber-500' },
  { value: 'sick', label: 'Enferma', color: 'bg-orange-500' },
  { value: 'critical', label: 'Muy enferma', color: 'bg-red-600' }
]

export const POT_MATERIAL_OPTIONS: { value: PotMaterial, label: string }[] = [
  { value: 'terracotta', label: 'Terracota' },
  { value: 'plastic', label: 'Plástico' },
  { value: 'ceramic', label: 'Cerámica' },
  { value: 'metal', label: 'Metal' },
  { value: 'other', label: 'Otro' }
]

export const POT_SIZE_OPTIONS: { value: PotSize, label: string }[] = [
  { value: 'xs', label: 'XS (< 10 cm)' },
  { value: 's', label: 'S (10–15 cm)' },
  { value: 'm', label: 'M (15–25 cm)' },
  { value: 'l', label: 'L (25–40 cm)' },
  { value: 'xl', label: 'XL (> 40 cm)' }
]

export const SUBSTRATE_OPTIONS: { value: SubstrateType, label: string }[] = [
  { value: 'universal', label: 'Universal' },
  { value: 'cactus_succulent', label: 'Cactus / suculentas' },
  { value: 'orchid', label: 'Orquídeas' },
  { value: 'acid_loving', label: 'Ácidas (ericáceas)' },
  { value: 'coco_coir', label: 'Fibra de coco' },
  { value: 'peat', label: 'Turba' },
  { value: 'other', label: 'Otro' }
]

export const HEALTH_STATUS_ORDER: Record<HealthStatus, number> = {
  critical: 0,
  sick: 1,
  fair: 2,
  healthy: 3
}

export function getHealthLabel(status: HealthStatus): string {
  return HEALTH_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status
}

export function getHealthColor(status: HealthStatus): string {
  return HEALTH_STATUS_OPTIONS.find(o => o.value === status)?.color ?? 'bg-gray-400'
}
