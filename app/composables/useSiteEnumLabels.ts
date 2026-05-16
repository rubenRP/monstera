import type { Luminosity, Placement, WindowOrientation } from '#shared/types/database'
import {
  LUMINOSITY_OPTIONS,
  PLACEMENT_OPTIONS,
  WINDOW_ORIENTATION_OPTIONS
} from '#shared/constants/sites'

export function useSiteEnumLabels() {
  const { t } = useI18n()

  const placementOptions = computed(() =>
    PLACEMENT_OPTIONS.map(o => ({
      ...o,
      label: t(`enums.placement.${o.value}`)
    }))
  )

  const orientationOptions = computed(() =>
    WINDOW_ORIENTATION_OPTIONS.map(o => ({
      ...o,
      label: t(`enums.orientation.${o.value}`)
    }))
  )

  const luminosityOptions = computed(() =>
    LUMINOSITY_OPTIONS.map(o => ({
      ...o,
      label: t(`enums.luminosity.${o.value}`),
      description: t(`enums.luminosityDesc.${o.value}`)
    }))
  )

  function placementLabel(value: Placement): string {
    return t(`enums.placement.${value}`)
  }

  function orientationLabel(value: WindowOrientation): string {
    return t(`enums.orientation.${value}`)
  }

  function luminosityLabel(value: Luminosity): string {
    return t(`enums.luminosity.${value}`)
  }

  return {
    placementOptions,
    orientationOptions,
    luminosityOptions,
    placementLabel,
    orientationLabel,
    luminosityLabel
  }
}
