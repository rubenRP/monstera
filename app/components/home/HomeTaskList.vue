<script setup lang="ts">
import type { CareTask } from '#shared/types/database'

defineProps<{
  tasks: CareTask[]
  completed: CareTask[]
  contextTasks: CareTask[]
  showUpcoming: boolean
  acting: string | null
  loading: boolean
}>()

const emit = defineEmits<{
  done: [taskId: string]
  skip: [task: CareTask]
}>()

const { t } = useI18n()
const {
  taskLabel,
  taskIcon,
  overdueDays,
  overdueLabel,
  taskDueLabel,
  fertilizeWithWater
} = useCareTasks()

function daysSinceWatered(iso: string) {
  const then = new Date(iso)
  const now = new Date()
  const startThen = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((startNow.getTime() - startThen.getTime()) / 86_400_000)
}

function lastWateredLabel(iso: string | null | undefined) {
  if (!iso) return t('home.lastWateredNever')
  const days = daysSinceWatered(iso)
  if (days <= 0) return t('home.lastWateredToday')
  if (days === 1) return t('home.lastWateredYesterday')
  return t('home.lastWateredDays', { days })
}

function lastWateredShort(iso: string | null | undefined) {
  if (!iso) return t('home.lastWateredShortNever')
  const days = daysSinceWatered(iso)
  if (days <= 0) return t('home.lastWateredShortToday')
  if (days === 1) return t('home.lastWateredShortYesterday')
  return t('home.lastWateredShortDays', { days })
}

function overdueShort(dueAt: string) {
  const days = overdueDays(dueAt)
  if (days <= 1) return t('home.overdueShortOne')
  return t('home.overdueShortMany', { days })
}
</script>

<template>
  <ul
    v-if="!loading && tasks.length"
    class="space-y-3"
  >
    <li
      v-for="task in tasks"
      :key="task.id"
      class="p-4 rounded-2xl border bg-elevated/40 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
      :class="overdueDays(task.due_at) > 0 ? 'border-default border-l-4 border-l-warning' : 'border-default'"
    >
      <div class="flex items-center gap-3">
        <span
          class="flex size-9 items-center justify-center rounded-xl shrink-0 ring-1 ring-inset"
          :class="overdueDays(task.due_at) > 0 ? 'bg-warning/10 text-warning ring-warning/15' : 'bg-primary/10 text-primary ring-primary/15'"
        >
          <UIcon
            :name="taskIcon(task.type)"
            class="w-5 h-5"
          />
        </span>
        <div class="min-w-0 flex-1">
          <NuxtLink
            :to="`/plants/${task.plant_id}`"
            class="font-medium truncate block hover:text-primary"
          >
            {{ task.plant?.name }}
          </NuxtLink>
          <p class="text-sm text-muted truncate">
            {{ taskLabel(task.type) }}
            <span v-if="fertilizeWithWater(task, tasks)"> · {{ t('care.fertilizeWithWater') }}</span>
            <span v-if="task.plant?.site?.name"> · {{ task.plant.site.name }}</span>
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-start gap-1 text-xs leading-none">
          <p
            class="inline-flex items-center gap-1 whitespace-nowrap text-muted"
            :title="lastWateredLabel(task.plant?.last_watered_at)"
            :aria-label="lastWateredLabel(task.plant?.last_watered_at)"
          >
            <UIcon
              name="i-lucide-droplets"
              class="size-3.5 text-primary"
            />
            {{ lastWateredShort(task.plant?.last_watered_at) }}
          </p>
          <p
            v-if="overdueDays(task.due_at) > 0"
            class="inline-flex items-center gap-1 whitespace-nowrap font-medium text-warning"
            :title="overdueLabel(task.due_at)"
            :aria-label="overdueLabel(task.due_at)"
          >
            <UIcon
              name="i-lucide-alarm-clock"
              class="size-3.5"
            />
            {{ overdueShort(task.due_at) }}
          </p>
          <p
            v-else-if="showUpcoming"
            class="inline-flex items-center gap-1 whitespace-nowrap text-muted"
          >
            <UIcon
              name="i-lucide-calendar"
              class="size-3.5"
            />
            {{ taskDueLabel(task.due_at) }}
          </p>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2 pl-12">
        <UButton
          size="sm"
          color="primary"
          :loading="acting === task.id"
          @click="emit('done', task.id)"
        >
          {{ t('common.done') }}
        </UButton>
        <UButton
          size="sm"
          variant="ghost"
          color="neutral"
          :loading="acting === task.id"
          @click="emit('skip', task)"
        >
          {{ t('common.skip') }}
        </UButton>
      </div>
    </li>
  </ul>

  <div
    v-if="!loading && !showUpcoming && completed.length"
    class="space-y-3 mt-6"
  >
    <h2 class="text-sm font-medium text-muted">
      {{ t('home.completedToday') }}
    </h2>
    <ul class="space-y-3">
      <li
        v-for="task in completed"
        :key="task.id"
        class="p-4 rounded-2xl border shadow-sm"
        :class="task.status === 'done'
          ? 'border-success/30 bg-success/5'
          : 'border-default bg-elevated/30'"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex size-9 items-center justify-center rounded-xl shrink-0 ring-1 ring-inset"
            :class="task.status === 'done' ? 'bg-success/10 text-success ring-success/15' : 'bg-elevated text-muted ring-default'"
          >
            <UIcon
              :name="taskIcon(task.type)"
              class="w-5 h-5"
            />
          </span>
          <div class="min-w-0 flex-1">
            <NuxtLink
              :to="`/plants/${task.plant_id}`"
              class="font-medium truncate block hover:text-primary"
            >
              {{ task.plant?.name }}
            </NuxtLink>
            <p class="text-sm text-muted truncate">
              {{ taskLabel(task.type) }}
              <span v-if="fertilizeWithWater(task, contextTasks)"> · {{ t('care.fertilizeWithWater') }}</span>
              <span v-if="task.plant?.site?.name"> · {{ task.plant.site.name }}</span>
            </p>
          </div>
          <p
            class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted"
            :title="lastWateredLabel(task.plant?.last_watered_at)"
            :aria-label="lastWateredLabel(task.plant?.last_watered_at)"
          >
            <UIcon
              name="i-lucide-droplets"
              class="size-3.5 text-primary"
            />
            {{ lastWateredShort(task.plant?.last_watered_at) }}
          </p>
          <div class="shrink-0">
            <UButton
              v-if="task.status === 'done'"
              size="sm"
              color="primary"
              icon="i-lucide-check"
              disabled
            >
              {{ t('common.done') }}
            </UButton>
            <UButton
              v-else
              size="sm"
              variant="ghost"
              color="neutral"
              disabled
            >
              {{ t('plants.historySkipped') }}
            </UButton>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
