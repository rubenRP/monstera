<script setup lang="ts">
import type { Site } from '#shared/types/database'

defineProps<{
  site: Site
}>()

const { t } = useI18n()
const { placementLabel, orientationLabel, luminosityLabel } = useSiteEnumLabels()
</script>

<template>
  <NuxtLink
    :to="`/sites/${site.id}`"
    class="group block p-4 rounded-2xl border border-default bg-elevated/30 shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-elevated/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-semibold text-lg flex items-center gap-2">
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-colors group-hover:bg-primary group-hover:text-inverted">
            <UIcon
              name="i-lucide-map-pin"
              class="w-4 h-4"
            />
          </span>
          {{ site.name }}
        </h3>
        <p class="text-sm text-muted mt-1">
          {{ placementLabel(site.placement) }}
          <span v-if="site.window_orientation"> · {{ orientationLabel(site.window_orientation) }}</span>
          <span v-if="site.luminosity"> · {{ luminosityLabel(site.luminosity) }}</span>
        </p>
        <p
          v-if="site.has_ceiling_cover"
          class="text-xs text-muted mt-1"
        >
          {{ t('sites.withCeiling') }}
        </p>
      </div>
      <UBadge
        color="primary"
        variant="subtle"
      >
        {{ t('sites.plantCount', { count: site.plants?.length ?? 0 }) }}
      </UBadge>
    </div>
  </NuxtLink>
</template>
