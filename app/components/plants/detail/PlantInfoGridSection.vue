<script setup lang="ts">
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'

export interface PlantInfoGridItem {
  icon: string
  iconTone?: SpeciesDisplayIconTone
  label: string
  sublabel: string
  missing?: boolean
}

defineProps<{
  title: string
  items: PlantInfoGridItem[]
}>()
</script>

<template>
  <PlantsSpeciesPlantSpeciesSectionCard :title="title">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
      <PlantsDetailPlantInfoIconRow
        v-for="(item, i) in items"
        :key="i"
        :icon="item.icon"
        :icon-tone="item.iconTone"
        :label="item.label"
        :sublabel="item.sublabel"
        :missing="item.missing"
      />
    </div>
    <slot />
  </PlantsSpeciesPlantSpeciesSectionCard>
</template>
