<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import {
  getLuminosityLabel,
  getOrientationLabel,
  getPlacementLabel
} from '#shared/constants/sites'
import { POT_MATERIAL_OPTIONS, POT_SIZE_OPTIONS, SUBSTRATE_OPTIONS } from '#shared/constants/plants'

const props = defineProps<{ plant: Plant }>()

const badges = computed(() => {
  const items: string[] = []
  const site = props.plant.site
  if (site) {
    items.push(site.name)
    items.push(getPlacementLabel(site.placement))
    if (site.window_orientation) items.push(`Ventana ${getOrientationLabel(site.window_orientation)}`)
    if (site.luminosity) items.push(getLuminosityLabel(site.luminosity))
    if (site.has_ceiling_cover) items.push('Techo/cubierta')
  }
  if (props.plant.window_distance_cm != null) {
    const m = props.plant.window_distance_cm / 100
    items.push(m >= 1 ? `${m.toFixed(1)} m a ventana` : `${props.plant.window_distance_cm} cm a ventana`)
  }
  if (props.plant.height_cm) items.push(`${props.plant.height_cm} cm`)
  if (props.plant.age_years) items.push(`${props.plant.age_years} años`)
  const material = POT_MATERIAL_OPTIONS.find(m => m.value === props.plant.pot_material)
  if (material) items.push(material.label)
  if (props.plant.pot_diameter_cm) items.push(`Ø ${props.plant.pot_diameter_cm} cm`)
  if (props.plant.has_drainage) items.push('Con drenaje')
  const pot = POT_SIZE_OPTIONS.find(p => p.value === props.plant.pot_size)
  if (pot) items.push(`Maceta ${pot.label.split(' ')[0]}`)
  const sub = SUBSTRATE_OPTIONS.find(s => s.value === props.plant.substrate_type)
  if (sub) items.push(sub.label)
  return items
})
</script>

<template>
  <div v-if="badges.length" class="flex flex-wrap gap-1.5">
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
