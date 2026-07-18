<script setup lang="ts">
import type { HealthStatus, Plant } from '#shared/types/database'

const props = withDefaults(defineProps<{
  plants: Plant[]
  todayTaskCount?: number
  overdueTaskCount?: number
}>(), {
  todayTaskCount: 0,
  overdueTaskCount: 0
})

const { t } = useI18n()

const HEALTH_ORDER: HealthStatus[] = ['critical', 'sick', 'fair', 'healthy']

const HEALTH_BAR_COLOR: Record<HealthStatus, string> = {
  critical: '#dc2626',
  sick: '#f97316',
  fair: '#f59e0b',
  healthy: '#38704a'
}

const HEALTH_DOT_COLOR: Record<HealthStatus, string> = HEALTH_BAR_COLOR

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

function healthChipLabel(status: HealthStatus, count: number): string {
  if (status === 'healthy') return t('home.healthHealthy', { count })
  if (status === 'fair') return count === 1 ? t('home.healthFairOne') : t('home.healthFairMany', { count })
  if (status === 'sick') return count === 1 ? t('home.healthSickOne') : t('home.healthSickMany', { count })
  return count === 1 ? t('home.healthCriticalOne') : t('home.healthCriticalMany', { count })
}

const healthChips = computed(() =>
  barSegments.value.map(segment => ({
    status: segment.status,
    label: healthChipLabel(segment.status, segment.count)
  }))
)

const attentionPlants = computed(() =>
  props.plants.filter(p => p.health_status === 'critical' || p.health_status === 'sick')
)

const attentionCount = computed(() => attentionPlants.value.length)

const stats = computed(() => [
  {
    key: 'today',
    icon: 'i-lucide-calendar-check',
    value: props.todayTaskCount,
    label: t('home.statTodayLabel'),
    active: props.todayTaskCount > 0,
    classes: 'text-primary bg-primary/10'
  },
  {
    key: 'overdue',
    icon: 'i-lucide-alarm-clock',
    value: props.overdueTaskCount,
    label: t('home.statOverdueLabel'),
    active: props.overdueTaskCount > 0,
    classes: 'text-warning bg-warning/10'
  },
  {
    key: 'attention',
    icon: 'i-lucide-heart-pulse',
    value: attentionCount.value,
    label: t('home.statAttentionLabel'),
    active: attentionCount.value > 0,
    classes: 'text-error bg-error/10'
  }
])

const headline = computed(() => {
  if (props.overdueTaskCount > 0) {
    return {
      icon: 'i-lucide-alarm-clock',
      tone: 'text-warning',
      bg: 'bg-warning/10',
      text: props.overdueTaskCount === 1
        ? t('home.headlineOverdueOne')
        : t('home.headlineOverdueMany', { count: props.overdueTaskCount })
    }
  }
  if (props.todayTaskCount > 0) {
    return {
      icon: 'i-lucide-calendar-check',
      tone: 'text-primary',
      bg: 'bg-primary/10',
      text: props.todayTaskCount === 1
        ? t('home.headlineTodayOne')
        : t('home.headlineTodayMany', { count: props.todayTaskCount })
    }
  }
  if (attentionCount.value > 0) {
    return {
      icon: 'i-lucide-heart-pulse',
      tone: 'text-error',
      bg: 'bg-error/10',
      text: attentionCount.value === 1
        ? t('home.headlineAttentionOne')
        : t('home.headlineAttentionMany', { count: attentionCount.value })
    }
  }
  return {
    icon: 'i-lucide-circle-check',
    tone: 'text-success',
    bg: 'bg-success/10',
    text: t('home.headlineAllGood')
  }
})

const totalLabel = computed(() =>
  totalPlants.value === 1
    ? t('home.plantTotalOne')
    : t('home.plantTotal', { count: totalPlants.value })
)
</script>

<template>
  <UCard v-if="totalPlants > 0">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-current/10"
            :class="[headline.bg, headline.tone]"
          >
            <UIcon
              :name="headline.icon"
              class="w-5 h-5"
              :class="headline.tone"
            />
          </div>
          <div class="min-w-0">
            <p class="font-semibold leading-tight truncate">
              {{ headline.text }}
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

    <div class="space-y-4">
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="flex flex-col gap-1.5 px-3.5 py-3 rounded-xl border border-default bg-elevated/40 transition-opacity"
          :class="stat.active ? '' : 'opacity-55'"
        >
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-current/10"
            :class="stat.active ? stat.classes : 'bg-elevated text-muted'"
          >
            <UIcon
              :name="stat.icon"
              class="w-4 h-4"
            />
          </div>
          <div class="min-w-0">
            <p class="text-xl font-bold leading-none tabular-nums">
              {{ stat.value }}
            </p>
            <p class="text-xs text-muted truncate mt-1">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-2.5">
        <div
          v-if="barSegments.length > 1"
          class="flex h-2 rounded-full overflow-hidden bg-accented"
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

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span
            v-for="chip in healthChips"
            :key="chip.status"
            class="flex items-center gap-1.5 text-xs text-muted"
          >
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ backgroundColor: HEALTH_DOT_COLOR[chip.status] }"
            />
            {{ chip.label }}
          </span>
        </div>
      </div>

      <div
        v-if="attentionCount > 0"
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
            v-for="plant in attentionPlants.slice(0, 5)"
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
            v-if="attentionPlants.length > 5"
            color="neutral"
            variant="subtle"
          >
            {{ t('home.morePlants', { count: attentionPlants.length - 5 }) }}
          </UBadge>
        </div>
      </div>
    </div>
  </UCard>
</template>
