<script setup lang="ts">
import { computeCareStats, type CareStats } from '#shared/utils/care/careStats'

const STATS_WINDOW_DAYS = 30
/** Below this the percentage is noise */
const MIN_COMPLETED = 3

const { t } = useI18n()
const { fetchCompletedForStats } = useCareTasks()

const stats = ref<CareStats | null>(null)

async function load() {
  try {
    stats.value = computeCareStats(await fetchCompletedForStats(STATS_WINDOW_DAYS))
  } catch {
    // Optional card: hide on failure
    stats.value = null
  }
}

onMounted(load)
defineExpose({ load })

const tiles = computed(() => {
  if (!stats.value) return []
  return [
    { key: 'pct', value: `${stats.value.onTimePct ?? 0}%`, label: t('stats.onTime'), icon: 'i-lucide-target' },
    { key: 'streak', value: String(stats.value.streak), label: t('stats.streak'), icon: 'i-lucide-flame' },
    { key: 'done', value: String(stats.value.completed), label: t('stats.completed'), icon: 'i-lucide-check-check' }
  ]
})
</script>

<template>
  <section
    v-if="stats && stats.completed >= MIN_COMPLETED"
    class="rounded-2xl border border-default bg-elevated/50 p-4"
    :aria-labelledby="'care-stats-title'"
  >
    <h2
      id="care-stats-title"
      class="mb-3 text-sm font-semibold text-highlighted"
    >
      {{ t('stats.title', { days: STATS_WINDOW_DAYS }) }}
    </h2>
    <dl class="grid grid-cols-3 gap-2">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        class="rounded-xl bg-default/60 p-3 text-center ring-1 ring-inset ring-default"
      >
        <dt class="flex items-center justify-center gap-1 text-[11px] text-muted">
          <UIcon
            :name="tile.icon"
            class="size-3.5 text-primary"
          />
          {{ tile.label }}
        </dt>
        <dd class="mt-0.5 text-xl font-bold text-highlighted tabular-nums">
          {{ tile.value }}
        </dd>
      </div>
    </dl>
    <p
      v-if="stats.latePlants.length"
      class="mt-3 text-xs text-muted"
    >
      {{ t('stats.mostLate') }}
      <template
        v-for="(plant, i) in stats.latePlants"
        :key="plant.plantId"
      >
        <NuxtLink
          :to="`/plants/${plant.plantId}`"
          class="font-medium text-default hover:text-primary"
        >{{ plant.name }}</NuxtLink>
        <span> ({{ plant.late }})</span><span v-if="i < stats.latePlants.length - 1">, </span>
      </template>
    </p>
    <p
      v-else
      class="mt-3 text-xs text-muted"
    >
      {{ t('stats.allOnTime') }}
    </p>
  </section>
</template>
