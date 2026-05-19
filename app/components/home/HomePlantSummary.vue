<script setup lang="ts">
import type { HealthStatus, Plant } from '#shared/types/database'
import { HEALTH_ICONS, HEALTH_ICON_CLASSES } from '#shared/constants/plants'

const props = defineProps<{
  plants: Plant[]
}>()

const { t } = useI18n()
const { healthLabel } = usePlantEnumLabels()

const HEALTH_ORDER: HealthStatus[] = ['critical', 'sick', 'fair', 'healthy']

const HEALTH_BAR_COLOR: Record<HealthStatus, string> = {
  critical: '#dc2626',
  sick: '#f97316',
  fair: '#f59e0b',
  healthy: '#38704a'
}

function attentionBadgeColor(status: HealthStatus): 'error' | 'warning' | 'neutral' {
  if (status === 'critical') return 'error'
  if (status === 'sick') return 'warning'
  return 'neutral'
}

const totalPlants = computed(() => props.plants.length)

const healthCounts = computed(() => {
  const c: Record<HealthStatus, number> = {
    healthy: 0,
    fair: 0,
    sick: 0,
    critical: 0
  }
  for (const p of props.plants) {
    c[p.health_status]++
  }
  return c
})

const barSegments = computed(() => {
  if (!totalPlants.value) return []
  return HEALTH_ORDER
    .filter(status => healthCounts.value[status] > 0)
    .map(status => ({
      status,
      count: healthCounts.value[status],
      percent: (healthCounts.value[status] / totalPlants.value) * 100
    }))
})

const plantsNeedingAttention = computed(() =>
  props.plants.filter(p =>
    p.health_status === 'critical'
    || p.health_status === 'sick'
    || p.health_status === 'fair'
  )
)

const totalLabel = computed(() =>
  totalPlants.value === 1
    ? t('home.plantTotalOne')
    : t('home.plantTotal', { count: totalPlants.value })
)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
          >
            <AppLogo class="w-5 h-5 text-primary" />
          </div>
          <div class="min-w-0">
            <p class="font-medium leading-tight">
              {{ t('home.plantSummary') }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              {{ totalLabel }}
            </p>
          </div>
        </div>
        <NuxtLink
          to="/plants"
          class="text-xs font-medium text-primary hover:underline shrink-0"
        >
          {{ t('home.viewAllPlants') }}
        </NuxtLink>
      </div>
    </template>

    <div
      v-if="totalPlants > 0"
      class="space-y-4"
    >
      <div
        class="flex h-2.5 rounded-full overflow-hidden bg-accented"
        role="img"
        :aria-label="t('home.healthDistributionAria')"
      >
        <div
          v-for="segment in barSegments"
          :key="segment.status"
          class="h-full shrink-0"
          :style="{
            width: `${segment.percent}%`,
            backgroundColor: HEALTH_BAR_COLOR[segment.status]
          }"
        />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="status in HEALTH_ORDER"
          :key="status"
          class="flex items-center gap-2.5 p-2.5 rounded-lg border border-default bg-elevated/40"
          :class="healthCounts[status] === 0 ? 'opacity-50' : ''"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :class="HEALTH_ICON_CLASSES[status]"
          >
            <UIcon
              :name="HEALTH_ICONS[status]"
              class="w-4 h-4"
            />
          </div>
          <div class="min-w-0">
            <p class="text-lg font-semibold leading-none tabular-nums">
              {{ healthCounts[status] }}
            </p>
            <p class="text-xs text-muted truncate mt-0.5">
              {{ healthLabel(status) }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="plantsNeedingAttention.length"
        class="pt-1 border-t border-default"
      >
        <p class="text-xs font-medium text-muted mb-2 flex items-center gap-1.5">
          <UIcon
            name="i-lucide-bell"
            class="w-3.5 h-3.5"
          />
          {{ t('home.needsAttention') }}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <NuxtLink
            v-for="plant in plantsNeedingAttention.slice(0, 5)"
            :key="plant.id"
            :to="`/plants/${plant.id}`"
          >
            <UBadge
              :color="attentionBadgeColor(plant.health_status)"
              variant="subtle"
              class="cursor-pointer"
            >
              {{ plant.name }}
            </UBadge>
          </NuxtLink>
          <UBadge
            v-if="plantsNeedingAttention.length > 5"
            color="neutral"
            variant="subtle"
          >
            {{ t('home.morePlants', { count: plantsNeedingAttention.length - 5 }) }}
          </UBadge>
        </div>
      </div>

      <div
        v-else
        class="flex items-center gap-2 text-sm text-success pt-1"
      >
        <UIcon
          name="i-lucide-circle-check"
          class="w-4 h-4 shrink-0"
        />
        {{ t('home.allHealthyMessage') }}
      </div>
    </div>
  </UCard>
</template>
