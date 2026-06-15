<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import { getHealthBorderColor } from '#shared/constants/plants'

defineProps<{
  plant: Plant
  photoSrc?: string | null
  archived?: boolean
}>()

const { healthLabel, archiveReasonLabel } = usePlantEnumLabels()
const { t } = useI18n()
</script>

<template>
  <NuxtLink
    :to="`/plants/${plant.id}`"
    class="flex items-center gap-3 p-3 rounded-xl border border-default border-l-4 bg-elevated/40 shadow-sm hover:bg-elevated hover:shadow-md transition-all"
    :class="[
      archived ? 'opacity-70 border-l-neutral-400' : getHealthBorderColor(plant.health_status)
    ]"
    :aria-label="t('plants.healthStatusAria', { label: healthLabel(plant.health_status) })"
  >
    <div
      v-if="photoSrc"
      class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0"
      :style="{ backgroundImage: `url(${photoSrc})` }"
    />
    <div
      v-else
      class="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center shrink-0"
    >
      <UIcon
        name="i-lucide-leaf"
        class="w-6 h-6 text-primary"
      />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <p class="font-semibold truncate">{{ plant.name }}</p>
        <span
          v-if="archived && plant.archive_reason"
          class="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-500/15 text-muted shrink-0"
        >
          {{ archiveReasonLabel(plant.archive_reason) }}
        </span>
      </div>
      <p
        v-if="plant.species"
        class="text-sm text-muted truncate"
      >{{ plant.species }}</p>
      <p
        v-if="plant.site?.name"
        class="text-xs text-muted truncate"
      >
        <UIcon
          name="i-lucide-map-pin"
          class="inline w-3 h-3"
        />
        {{ plant.site.name }}
      </p>
    </div>
    <UIcon
      name="i-lucide-chevron-right"
      class="text-muted shrink-0"
    />
  </NuxtLink>
</template>
