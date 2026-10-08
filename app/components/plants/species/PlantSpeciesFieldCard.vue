<script setup lang="ts">
import type { SpeciesDisplayBlock } from '#shared/types/speciesDisplay'

defineProps<{
  title: string
  blocks: SpeciesDisplayBlock[]
  fallback: string | null
}>()

const { t } = useI18n()
</script>

<template>
  <PlantsSpeciesPlantSpeciesSectionCard :title="title">
    <PlantsSpeciesPlantSpeciesBlockRenderer
      v-if="blocks.length"
      :blocks="blocks"
    />
    <p
      v-else-if="fallback"
      class="text-sm text-toned whitespace-pre-wrap"
    >
      {{ fallback }}
    </p>
    <p
      v-else
      class="text-sm text-muted"
    >
      {{ t('species.unavailable') }}
    </p>
  </PlantsSpeciesPlantSpeciesSectionCard>
</template>
