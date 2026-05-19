<script setup lang="ts">
import type { SpeciesDisplayBlock } from '#shared/types/speciesDisplay'

defineProps<{
  blocks: SpeciesDisplayBlock[]
}>()
</script>

<template>
  <div class="space-y-4">
    <template
      v-for="(block, i) in blocks"
      :key="i"
    >
      <PlantsSpeciesPlantSpeciesIconRow
        v-if="block.kind === 'row'"
        :icon="block.icon"
        :icon-tone="block.iconTone"
        :label="block.label"
        :sublabel="block.sublabel"
        :badge="block.badge"
      />
      <PlantsSpeciesPlantSpeciesInfoBox
        v-else-if="block.kind === 'info'"
        :text="block.text"
      />
      <PlantsSpeciesPlantSpeciesTagList
        v-else-if="block.kind === 'tags'"
        :items="block.items"
      />
      <PlantsSpeciesPlantSpeciesRangeBar
        v-else-if="block.kind === 'range'"
        :label="block.label"
        :min="block.min"
        :max="block.max"
        :unit="block.unit"
        :scale-min="block.scaleMin"
        :scale-max="block.scaleMax"
      />
      <PlantsSpeciesPlantSpeciesMonthTimeline
        v-else-if="block.kind === 'monthTimeline'"
        :title="block.title"
        :description="block.description"
        :start-month="block.startMonth"
        :end-month="block.endMonth"
        :label="block.label"
      />
      <PlantsSpeciesPlantSpeciesListGroup
        v-else-if="block.kind === 'list'"
        :title="block.title"
        :items="block.items"
      />
      <p
        v-else-if="block.kind === 'paragraph'"
        class="text-sm text-toned whitespace-pre-wrap"
      >
        {{ block.text }}
      </p>
    </template>
  </div>
</template>
