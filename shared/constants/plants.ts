import type { HealthStatus, PlantArchiveReason, PotMaterial, PotSize, SubstrateType } from '../types/database'

export const ARCHIVE_REASON_OPTIONS: { value: PlantArchiveReason }[] = [
  { value: 'died' },
  { value: 'gifted' }
]

export const HEALTH_STATUS_OPTIONS: { value: HealthStatus, color: string }[] = [
  { value: 'healthy', color: 'bg-green-600' },
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

export const HEALTH_ICONS: Record<HealthStatus, string> = {
  healthy: 'i-lucide-heart',
  fair: 'i-lucide-cloud-sun',
  sick: 'i-lucide-bandage',
  critical: 'i-lucide-alert-triangle'
}

/** Circular icon in HealthSemaphore — static classes for Tailwind scan */
export const HEALTH_ICON_CLASSES: Record<HealthStatus, string> = {
  healthy: 'bg-green-600/15 text-green-600 dark:text-green-400',
  fair: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  sick: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  critical: 'bg-red-600/15 text-red-600 dark:text-red-400'
}

export const HEALTH_ICON_SELECTED_CLASSES: Record<HealthStatus, string> = {
  healthy: 'bg-green-600/25 text-green-700 dark:text-green-300 ring-2 ring-green-600/50',
  fair: 'bg-amber-500/25 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/50',
  sick: 'bg-orange-500/25 text-orange-800 dark:text-orange-300 ring-2 ring-orange-500/50',
  critical: 'bg-red-600/25 text-red-700 dark:text-red-300 ring-2 ring-red-600/50'
}

/** Selected option pill in HealthSemaphore */
export const HEALTH_SELECTED_CLASSES: Record<HealthStatus, string> = {
  healthy: 'bg-elevated shadow-sm',
  fair: 'bg-elevated shadow-sm',
  sick: 'bg-elevated shadow-sm',
  critical: 'bg-elevated shadow-sm'
}

export const HEALTH_DOT_CLASSES: Record<HealthStatus, string> = {
  healthy: 'bg-green-600',
  fair: 'bg-amber-500',
  sick: 'bg-orange-500',
  critical: 'bg-red-600'
}

/** Pill badge next to plant name — static classes for Tailwind scan */
export const HEALTH_BADGE_CLASSES: Record<HealthStatus, string> = {
  healthy: 'bg-green-600/15 text-green-800 dark:text-green-300',
  fair: 'bg-amber-500/15 text-amber-900 dark:text-amber-300',
  sick: 'bg-orange-500/15 text-orange-900 dark:text-orange-300',
  critical: 'bg-red-600/15 text-red-900 dark:text-red-300'
}

export function getHealthBadgeClasses(status: HealthStatus): string {
  return HEALTH_BADGE_CLASSES[status] ?? 'bg-gray-400/15 text-gray-800'
}

export function getHealthColor(status: HealthStatus): string {
  return HEALTH_STATUS_OPTIONS.find(o => o.value === status)?.color ?? 'bg-gray-400'
}

const HEALTH_BORDER_COLORS: Record<HealthStatus, string> = {
  healthy: 'border-l-green-600',
  fair: 'border-l-amber-500',
  sick: 'border-l-orange-500',
  critical: 'border-l-red-600'
}

export function getHealthBorderColor(status: HealthStatus): string {
  return HEALTH_BORDER_COLORS[status] ?? 'border-l-gray-400'
}
