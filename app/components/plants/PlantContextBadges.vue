<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import { defaultPlantAgeUnit, formatPlantAge } from '#shared/utils/plants/formatPlantAge'
import { usesWindowDistance } from '#shared/utils/sites/placement'

const props = defineProps<{ plant: Plant }>()

const { t } = useI18n()
const { potMaterialLabel, potSizeLabel, substrateLabel } = usePlantEnumLabels()
const { placementLabel, orientationLabel, luminosityLabel } = useSiteEnumLabels()

const badges = computed(() => {
  const items: string[] = []
  const site = props.plant.site
  if (site) {
    items.push(site.name)
    items.push(placementLabel(site.placement))
    if (site.window_orientation) {
      items.push(t('plants.badgeWindow', { orientation: orientationLabel(site.window_orientation) }))
    }
    if (site.luminosity) items.push(luminosityLabel(site.luminosity))
    if (site.has_ceiling_cover) items.push(t('sites.withCeiling'))
  }
  if (props.plant.window_distance_cm != null && usesWindowDistance(site?.placement)) {
    const m = props.plant.window_distance_cm / 100
    items.push(m >= 1
      ? t('plants.badgeDistanceM', { value: m.toFixed(1) })
      : t('plants.badgeDistanceCm', { value: props.plant.window_distance_cm }))
  }
  if (props.plant.height_cm) items.push(`${props.plant.height_cm} ${t('common.cm')}`)
  if (props.plant.age_years) {
    items.push(formatPlantAge(
      props.plant.age_years,
      defaultPlantAgeUnit(props.plant.age_years, props.plant.age_unit),
      t
    ))
  }
  if (props.plant.pot_material) items.push(potMaterialLabel(props.plant.pot_material))
  if (props.plant.pot_diameter_cm) items.push(`Ø ${props.plant.pot_diameter_cm} ${t('common.cm')}`)
  if (props.plant.has_drainage) items.push(t('plants.badgeWithDrainage'))
  if (props.plant.pot_size) {
    const label = potSizeLabel(props.plant.pot_size)
    items.push(t('plants.badgePot', { size: label.split(' ')[0] }))
  }
  if (props.plant.substrate_type) items.push(substrateLabel(props.plant.substrate_type))
  return items
})
</script>

<template>
  <div
    v-if="badges.length"
    class="flex flex-wrap gap-1.5"
  >
    <UBadge
      v-for="(b, i) in badges"
      :key="i"
      color="neutral"
      variant="subtle"
      size="sm"
    >
      {{ b }}
    </UBadge>
  </div>
</template>
