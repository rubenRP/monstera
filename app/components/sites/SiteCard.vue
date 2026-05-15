<script setup lang="ts">
import type { Site } from '#shared/types/database'
import {
  getLuminosityLabel,
  getOrientationLabel,
  getPlacementLabel
} from '#shared/constants/sites'

defineProps<{
  site: Site
}>()
</script>

<template>
  <NuxtLink
    :to="`/sites/${site.id}`"
    class="block p-4 rounded-xl border border-default bg-elevated/30 hover:bg-elevated/60 transition-colors"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-semibold text-lg flex items-center gap-2">
          <UIcon name="i-lucide-map-pin" class="text-primary w-5 h-5" />
          {{ site.name }}
        </h3>
        <p class="text-sm text-muted mt-1">
          {{ getPlacementLabel(site.placement) }}
          <span v-if="site.window_orientation"> · {{ getOrientationLabel(site.window_orientation) }}</span>
          <span v-if="site.luminosity"> · {{ getLuminosityLabel(site.luminosity) }}</span>
        </p>
        <p v-if="site.has_ceiling_cover" class="text-xs text-muted mt-1">
          Con techo/cubierta
        </p>
      </div>
      <UBadge color="primary" variant="subtle">
        {{ site.plants?.length ?? 0 }} plantas
      </UBadge>
    </div>
  </NuxtLink>
</template>
