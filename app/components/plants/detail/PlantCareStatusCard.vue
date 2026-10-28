<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { CareTask, Plant } from '#shared/types/database'

const props = defineProps<{
  plant: Plant
  pendingTasks: CareTask[]
  actingTaskId: string | null
}>()

const emit = defineEmits<{
  complete: [task: CareTask]
  skip: [task: CareTask]
  postpone: [task: CareTask, days: number]
}>()

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const { taskLabel, taskIcon, overdueDays, taskDueLabel, fertilizeWithWater } = useCareTasks()

const RING_RADIUS = 34
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const sortedTasks = computed(() =>
  [...props.pendingTasks].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
)

const waterTask = computed(() => props.pendingTasks.find(task => task.type === 'water') ?? null)

/** Days until the next watering (negative when overdue). */
const daysLeft = computed(() => (waterTask.value ? -overdueDays(waterTask.value.due_at) : null))

/** Share of the interval already elapsed: full ring = water now. */
const ringProgress = computed(() => {
  const interval = props.plant.watering_interval_days
  if (daysLeft.value == null || !interval) return 0
  return Math.min(1, Math.max(0, 1 - daysLeft.value / interval))
})

const ringTone = computed(() => {
  if (daysLeft.value == null) return 'text-muted'
  if (daysLeft.value < 0) return 'text-warning'
  if (daysLeft.value === 0) return 'text-primary'
  return 'text-primary/70'
})

const ringCenter = computed(() => {
  if (daysLeft.value == null) return '—'
  if (daysLeft.value <= 0) return t('plants.ringNow')
  return t('plants.ringDays', { days: daysLeft.value })
})

const lastWateredLabel = computed(() => {
  const iso = props.plant.last_watered_at
  if (!iso) return t('plants.lastWateredNever')
  return new Date(iso).toLocaleDateString(dateLocale.value, { day: 'numeric', month: 'short' })
})

function taskMenu(task: CareTask): DropdownMenuItem[][] {
  return [
    [
      { label: t('common.done'), icon: 'i-lucide-check', onSelect: () => emit('complete', task) },
      { label: t('common.skip'), icon: 'i-lucide-skip-forward', onSelect: () => emit('skip', task) }
    ],
    [1, 2, 3].map(days => ({
      label: t('home.postponeDays', { days }, days),
      icon: 'i-lucide-clock',
      onSelect: () => emit('postpone', task, days)
    }))
  ]
}
</script>

<template>
  <section
    class="rounded-2xl border border-default bg-elevated/50 p-4"
    :aria-label="t('care.pendingTasks')"
  >
    <div class="flex items-center gap-4">
      <div
        class="relative size-[84px] shrink-0"
        role="img"
        :aria-label="waterTask ? t('plants.ringAria', { label: taskDueLabel(waterTask.due_at) }) : t('plants.noWaterScheduled')"
      >
        <svg
          viewBox="0 0 80 80"
          class="size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="40"
            cy="40"
            :r="RING_RADIUS"
            fill="none"
            stroke-width="7"
            class="stroke-current text-primary/10"
          />
          <circle
            cx="40"
            cy="40"
            :r="RING_RADIUS"
            fill="none"
            stroke-width="7"
            stroke-linecap="round"
            class="stroke-current transition-[stroke-dashoffset] duration-700 ease-out"
            :class="ringTone"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="RING_CIRCUMFERENCE * (1 - ringProgress)"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <UIcon
            name="i-lucide-droplets"
            class="size-4"
            :class="ringTone"
          />
          <span class="text-sm font-semibold leading-tight text-highlighted tabular-nums">{{ ringCenter }}</span>
        </div>
      </div>
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-wide text-muted">
          {{ t('plants.nextWatering') }}
        </p>
        <p
          class="text-lg font-semibold first-letter:uppercase"
          :class="daysLeft != null && daysLeft < 0 ? 'text-warning' : 'text-highlighted'"
        >
          {{ waterTask ? taskDueLabel(waterTask.due_at) : t('plants.noWaterScheduled') }}
        </p>
        <p class="text-xs text-muted">
          {{ t('plants.everyDays', { days: plant.watering_interval_days }, plant.watering_interval_days) }}
          · {{ t('plants.lastWatered') }} {{ lastWateredLabel }}
        </p>
      </div>
    </div>

    <ul
      v-if="sortedTasks.length"
      class="mt-4 divide-y divide-default border-t border-default"
    >
      <li
        v-for="task in sortedTasks"
        :key="task.id"
        class="flex items-center gap-3 py-2.5"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset"
          :class="overdueDays(task.due_at) > 0 ? 'bg-warning/10 text-warning ring-warning/20' : 'bg-primary/10 text-primary ring-primary/15'"
        >
          <UIcon
            :name="taskIcon(task.type)"
            class="size-4"
          />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">
            {{ taskLabel(task.type) }}
            <span
              v-if="fertilizeWithWater(task, pendingTasks)"
              class="font-normal text-muted"
            > · {{ t('care.fertilizeWithWater') }}</span>
          </p>
          <p
            class="text-xs"
            :class="overdueDays(task.due_at) > 0 ? 'text-warning' : 'text-muted'"
          >
            {{ taskDueLabel(task.due_at) }}
          </p>
        </div>
        <UDropdownMenu
          :items="taskMenu(task)"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="actingTaskId === task.id"
            :aria-label="t('plants.taskOptionsAria', { task: taskLabel(task.type) })"
          />
        </UDropdownMenu>
      </li>
    </ul>
  </section>
</template>
