import type { HealthStatus, PotMaterial, PotSize, SubstrateType } from '#shared/types/database'
import {
  HEALTH_STATUS_OPTIONS,
  POT_MATERIAL_OPTIONS,
  POT_SIZE_OPTIONS,
  SUBSTRATE_OPTIONS
} from '#shared/constants/plants'

export function usePlantEnumLabels() {
  const { t } = useI18n()

  const healthOptions = computed(() =>
    HEALTH_STATUS_OPTIONS.map(o => ({
      ...o,
      label: t(`enums.health.${o.value}`)
    }))
  )

  const potMaterialOptions = computed(() =>
    POT_MATERIAL_OPTIONS.map(o => ({
      ...o,
      label: t(`enums.potMaterial.${o.value}`)
    }))
  )

  const potSizeOptions = computed(() =>
    POT_SIZE_OPTIONS.map(o => ({
      ...o,
      label: t(`enums.potSize.${o.value}`)
    }))
  )

  const substrateOptions = computed(() =>
    SUBSTRATE_OPTIONS.map(o => ({
      ...o,
      label: t(`enums.substrate.${o.value}`)
    }))
  )

  function healthLabel(status: HealthStatus): string {
    return t(`enums.health.${status}`)
  }

  function potMaterialLabel(value: PotMaterial): string {
    return t(`enums.potMaterial.${value}`)
  }

  function potSizeLabel(value: PotSize): string {
    return t(`enums.potSize.${value}`)
  }

  function substrateLabel(value: SubstrateType): string {
    return t(`enums.substrate.${value}`)
  }

  return {
    healthOptions,
    potMaterialOptions,
    potSizeOptions,
    substrateOptions,
    healthLabel,
    potMaterialLabel,
    potSizeLabel,
    substrateLabel
  }
}
