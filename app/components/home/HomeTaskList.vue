<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { CareTask, CareTaskType } from '#shared/types/database'

const props = defineProps<{
  tasks: CareTask[]
  completed: CareTask[]
  contextTasks: CareTask[]
  showUpcoming: boolean
  acting: string | null
  loading: boolean
  photoFor: (path: string | null | undefined) => string | null
}>()

const emit = defineEmits<{
  done: [task: CareTask]
  doneGroup: [tasks: CareTask[]]
  skip: [task: CareTask]
  postpone: [task: CareTask, days: number]
}>()

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const {
  taskLabel,
  taskIcon,
  overdueDays,
  overdueLabel,
  taskDueLabel,
  fertilizeWithWater
} = useCareTasks()

const TYPE_ORDER: CareTaskType[] = ['water', 'fertilize', 'check_in']
const POSTPONE_DAYS = [1, 2, 3] as const

/** Tasks whose check animation is playing (before the parent hides them). */
const checking = ref<Set<string>>(new Set())
const completedOpen = ref(false)

interface TaskGroup {
  key: string
  title: string
  icon: string
  tasks: CareTask[]
  /** Only same-type groups of water/fertilize can be completed in one go. */
  bulkType: CareTaskType | null
}

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayTitle(task: CareTask) {
  const overdue = overdueDays(task.due_at)
  if (overdue >= 0) return t('care.dueToday')
  if (overdue === -1) return t('care.dueTomorrow')
  return new Date(task.due_at).toLocaleDateString(dateLocale.value, { weekday: 'long', day: 'numeric', month: 'short' })
}

const groups = computed<TaskGroup[]>(() => {
  if (props.showUpcoming) {
    const byDay = new Map<string, TaskGroup>()
    for (const task of props.tasks) {
      // Overdue tasks are shown with today's tasks
      const key = overdueDays(task.due_at) >= 0 ? 'today' : dayKey(task.due_at)
      if (!byDay.has(key)) {
        byDay.set(key, { key, title: dayTitle(task), icon: 'i-lucide-calendar', tasks: [], bulkType: null })
      }
      byDay.get(key)!.tasks.push(task)
    }
    return [...byDay.values()]
  }

  return TYPE_ORDER
    .map(type => ({
      key: type,
      title: taskLabel(type),
      icon: taskIcon(type),
      tasks: props.tasks.filter(task => task.type === type),
      bulkType: type === 'check_in' ? null : type
    }))
    .filter(group => group.tasks.length > 0)
})

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

function taskMenu(task: CareTask): DropdownMenuItem[][] {
  return [
    [
      { label: t('common.skip'), icon: 'i-lucide-skip-forward', onSelect: () => emit('skip', task) }
    ],
    POSTPONE_DAYS.map(days => ({
      label: t('home.postponeDays', { days }, days),
      icon: 'i-lucide-clock',
      onSelect: () => emit('postpone', task, days)
    })),
    [
      { label: t('home.viewPlant'), icon: 'i-lucide-leaf', to: `/plants/${task.plant_id}` }
    ]
  ]
}

function onCheck(task: CareTask) {
  if (checking.value.has(task.id)) return
  // Check-ins open a form: no "done" animation
  if (task.type === 'check_in') {
    emit('done', task)
    return
  }
  checking.value = new Set(checking.value).add(task.id)
  if (import.meta.client && 'vibrate' in navigator) navigator.vibrate(12)
  setTimeout(() => {
    emit('done', task)
    const next = new Set(checking.value)
    next.delete(task.id)
    checking.value = next
  }, 320)
}

function onCheckGroup(group: TaskGroup) {
  if (import.meta.client && 'vibrate' in navigator) navigator.vibrate([12, 40, 12])
  emit('doneGroup', group.tasks.filter(task => task.type !== 'check_in'))
}

function checkLabel(task: CareTask) {
  return t('home.markDoneAria', { task: taskLabel(task.type), plant: task.plant?.name ?? '' })
}
</script>

<template>
  <div
    v-if="!loading && tasks.length"
    class="space-y-6"
  >
    <section
      v-for="group in groups"
      :key="group.key"
      :aria-labelledby="`task-group-${group.key}`"
    >
      <header class="mb-2 flex items-center gap-2">
        <UIcon
          :name="group.icon"
          class="size-4 text-primary"
        />
        <h2
          :id="`task-group-${group.key}`"
          class="text-sm font-semibold text-highlighted first-letter:uppercase"
        >
          {{ group.title }}
        </h2>
        <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">
          {{ group.tasks.length }}
        </span>
        <UButton
          v-if="group.bulkType && group.tasks.length > 1"
          class="ml-auto"
          size="xs"
          variant="soft"
          icon="i-lucide-check-check"
          @click="onCheckGroup(group)"
        >
          {{ t('home.completeAll') }}
        </UButton>
      </header>

      <TransitionGroup
        tag="ul"
        name="task"
        class="relative space-y-2"
      >
        <li
          v-for="task in group.tasks"
          :key="task.id"
          class="flex items-center gap-3 rounded-2xl border border-default bg-elevated/50 p-2.5 pr-2 shadow-xs transition-colors"
          :class="[
            overdueDays(task.due_at) > 0 ? 'border-l-4 border-l-warning' : '',
            checking.has(task.id) ? 'bg-success/10 border-success/30' : ''
          ]"
        >
          <NuxtLink
            :to="`/plants/${task.plant_id}`"
            class="flex min-w-0 flex-1 items-center gap-3"
          >
            <PlantsPlantAvatar
              :name="task.plant?.name ?? '?'"
              :photo-src="photoFor(task.plant?.photo_path)"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-highlighted">
                {{ task.plant?.name }}
              </p>
              <p class="truncate text-xs text-muted">
                <template v-if="showUpcoming">
                  {{ taskLabel(task.type) }} ·
                </template>
                <template v-if="task.type === 'water'">
                  {{ lastWateredLabel(task.plant?.last_watered_at) }}
                </template>
                <template v-else-if="fertilizeWithWater(task, contextTasks)">
                  {{ t('care.fertilizeWithWater') }}
                </template>
                <template v-else-if="task.plant?.site?.name">
                  {{ task.plant.site.name }}
                </template>
              </p>
              <p
                v-if="overdueDays(task.due_at) > 0"
                class="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-warning"
              >
                <UIcon
                  name="i-lucide-alarm-clock"
                  class="size-3.5"
                />
                {{ overdueLabel(task.due_at) }}
              </p>
              <p
                v-else-if="showUpcoming && overdueDays(task.due_at) < 0"
                class="mt-0.5 text-xs text-muted"
              >
                {{ taskDueLabel(task.due_at) }}
              </p>
            </div>
          </NuxtLink>

          <UDropdownMenu
            :items="taskMenu(task)"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="t('home.taskOptionsAria', { plant: task.plant?.name ?? '' })"
            />
          </UDropdownMenu>

          <button
            type="button"
            class="task-check flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            :class="checking.has(task.id)
              ? 'is-checking border-success bg-success text-inverted'
              : 'border-primary/50 text-primary/70 hover:border-primary hover:bg-primary/10 hover:text-primary'"
            :aria-label="checkLabel(task)"
            :disabled="acting === task.id"
            @click="onCheck(task)"
          >
            <UIcon
              :name="task.type === 'check_in' ? 'i-lucide-clipboard-check' : 'i-lucide-check'"
              class="size-5"
            />
          </button>
        </li>
      </TransitionGroup>
    </section>
  </div>

  <section
    v-if="!loading && !showUpcoming && completed.length"
    class="mt-6"
  >
    <UCollapsible v-model:open="completedOpen">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        class="-ml-2"
        :trailing-icon="completedOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
      >
        {{ t('home.completedToday') }}
        <span class="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success tabular-nums">
          {{ completed.length }}
        </span>
      </UButton>

      <template #content>
        <ul class="mt-2 space-y-1.5">
          <li
            v-for="task in completed"
            :key="task.id"
            class="flex items-center gap-3 rounded-xl px-2 py-1.5"
          >
            <PlantsPlantAvatar
              size="sm"
              :name="task.plant?.name ?? '?'"
              :photo-src="photoFor(task.plant?.photo_path)"
              :class="task.status === 'done' ? '' : 'opacity-60'"
            />
            <NuxtLink
              :to="`/plants/${task.plant_id}`"
              class="min-w-0 flex-1 truncate text-sm hover:text-primary"
            >
              <span class="font-medium">{{ task.plant?.name }}</span>
              <span class="text-muted"> · {{ taskLabel(task.type) }}</span>
            </NuxtLink>
            <span
              class="inline-flex items-center gap-1 text-xs"
              :class="task.status === 'done' ? 'text-success' : 'text-muted'"
            >
              <UIcon
                :name="task.status === 'done' ? 'i-lucide-check' : 'i-lucide-skip-forward'"
                class="size-3.5"
              />
              {{ task.status === 'done' ? t('care.statusDone') : t('care.statusSkipped') }}
            </span>
          </li>
        </ul>
      </template>
    </UCollapsible>
  </section>
</template>

<style scoped>
.task-leave-active {
  position: absolute;
  inset-inline: 0;
  transition: opacity 250ms ease, transform 250ms ease;
}

.task-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.task-move {
  transition: transform 250ms ease;
}

@media (prefers-reduced-motion: no-preference) {
  .task-check.is-checking :deep(svg),
  .task-check.is-checking :deep(.iconify) {
    animation: check-pop 320ms ease-out;
  }
}

@keyframes check-pop {
  0% { transform: scale(0.4); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .task-leave-active,
  .task-move {
    transition: none;
  }
}
</style>
