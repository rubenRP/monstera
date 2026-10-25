<script setup lang="ts">
import type { CareTask, CareTaskType } from '#shared/types/database'
import { projectRecurrences } from '#shared/utils/care/projectRecurrences'

const { t } = useI18n()
usePageTitle(() => t('care.calendarTitle'))
const { dateLocale } = useDateLocale()
const { fetchPendingTasksWithIntervals, fetchResolvedTasksInRange, taskLabel, taskIcon } = useCareTasks()
const { apiErrorMessage } = useApiError()
const { urlFor: photoFor, ensure: ensurePhotoUrls } = usePlantPhotoUrls()

type EntryStatus = 'done' | 'skipped' | 'pending' | 'projected'

interface CalendarEntry {
  id: string
  plantId: string
  plant: CareTask['plant']
  type: CareTaskType
  status: EntryStatus
  /** Pending task shown on today because it is overdue */
  overdue: boolean
}

/** Static classes so Tailwind keeps them. */
const TYPE_DOT: Record<CareTaskType, string> = {
  water: 'bg-sky-500',
  fertilize: 'bg-amber-500',
  check_in: 'bg-violet-500'
}

const month = ref(startOfMonth(new Date()))
const selectedDay = ref(startOfDay(new Date()))
const resolved = ref<CareTask[]>([])
const pending = ref<CareTask[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function dayKey(d: Date | string) {
  return startOfDay(new Date(d)).toDateString()
}

const today = computed(() => startOfDay(new Date()))

/** Monday-first grid covering the whole month. */
const gridDays = computed(() => {
  const first = month.value
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  const lastOfMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const cells = Math.ceil((offset + lastOfMonth.getDate()) / 7) * 7
  return Array.from({ length: cells }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
})

const gridRange = computed(() => {
  const days = gridDays.value
  const end = new Date(days[days.length - 1]!)
  end.setHours(23, 59, 59, 999)
  return { start: days[0]!, end }
})

const weekdayLabels = computed(() => {
  const monday = new Date(2026, 0, 5)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toLocaleDateString(dateLocale.value, { weekday: 'narrow' })
  })
})

const monthTitle = computed(() =>
  month.value.toLocaleDateString(dateLocale.value, { month: 'long', year: 'numeric' })
)

const entriesByDay = computed(() => {
  const map = new Map<string, CalendarEntry[]>()
  const push = (key: string, entry: CalendarEntry) => {
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(entry)
  }
  const todayKey = dayKey(today.value)

  for (const task of resolved.value) {
    if (!task.completed_at) continue
    push(dayKey(task.completed_at), {
      id: task.id,
      plantId: task.plant_id,
      plant: task.plant,
      type: task.type,
      status: task.status === 'done' ? 'done' : 'skipped',
      overdue: false
    })
  }

  for (const task of pending.value) {
    const overdue = startOfDay(new Date(task.due_at)).getTime() < today.value.getTime()
    push(overdue ? todayKey : dayKey(task.due_at), {
      id: task.id,
      plantId: task.plant_id,
      plant: task.plant,
      type: task.type,
      status: 'pending',
      overdue
    })
  }

  for (const p of projectRecurrences(pending.value, today.value, gridRange.value.end)) {
    push(dayKey(p.due_at), {
      id: p.id,
      plantId: p.plant_id,
      plant: p.plant,
      type: p.type,
      status: 'projected',
      overdue: false
    })
  }
  return map
})

function entriesFor(day: Date) {
  return entriesByDay.value.get(dayKey(day)) ?? []
}

/** One dot per task type present that day (resolved ones faded). */
function dotsFor(day: Date) {
  const entries = entriesFor(day)
  return (['water', 'fertilize', 'check_in'] as CareTaskType[])
    .filter(type => entries.some(e => e.type === type))
    .map(type => ({
      type,
      faded: entries.filter(e => e.type === type).every(e => e.status === 'done' || e.status === 'skipped')
    }))
}

const selectedEntries = computed(() => {
  const order: Record<EntryStatus, number> = { pending: 0, projected: 1, done: 2, skipped: 3 }
  return [...entriesFor(selectedDay.value)].sort((a, b) => order[a.status] - order[b.status])
})

const selectedTitle = computed(() =>
  selectedDay.value.toLocaleDateString(dateLocale.value, { weekday: 'long', day: 'numeric', month: 'long' })
)

function isSameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b)
}

function dayAriaLabel(day: Date) {
  const count = entriesFor(day).length
  const date = day.toLocaleDateString(dateLocale.value, { weekday: 'long', day: 'numeric', month: 'long' })
  return count ? t('calendar.dayAria', { date, count }, count) : date
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [pendingTasks, resolvedTasks] = await Promise.all([
      fetchPendingTasksWithIntervals(),
      fetchResolvedTasksInRange(gridRange.value.start, gridRange.value.end)
    ])
    pending.value = pendingTasks
    resolved.value = resolvedTasks
    void ensurePhotoUrls([...pendingTasks, ...resolvedTasks].map(task => task.plant?.photo_path))
  } catch (e: unknown) {
    pending.value = []
    resolved.value = []
    loadError.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function shiftMonth(delta: number) {
  const next = new Date(month.value.getFullYear(), month.value.getMonth() + delta, 1)
  month.value = next
  selectedDay.value = isSameDay(startOfMonth(today.value), next) ? today.value : next
  void load()
}

function goToday() {
  const sameMonth = isSameDay(startOfMonth(today.value), month.value)
  selectedDay.value = today.value
  if (!sameMonth) {
    month.value = startOfMonth(today.value)
    void load()
  }
}

function statusLabel(entry: CalendarEntry) {
  if (entry.status === 'done') return t('care.statusDone')
  if (entry.status === 'skipped') return t('care.statusSkipped')
  if (entry.status === 'projected') return t('calendar.projected')
  if (entry.overdue) return t('calendar.overdue')
  return t('calendar.pending')
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-bold">
        {{ t('care.calendarTitle') }}
      </h1>
      <UButton
        size="sm"
        variant="soft"
        icon="i-lucide-calendar-check"
        @click="goToday"
      >
        {{ t('calendar.today') }}
      </UButton>
    </div>

    <section class="rounded-2xl border border-default bg-elevated/50 p-3">
      <div class="mb-2 flex items-center justify-between">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          :aria-label="t('calendar.prevMonth')"
          @click="shiftMonth(-1)"
        />
        <h2 class="text-sm font-semibold capitalize text-highlighted">
          {{ monthTitle }}
        </h2>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          :aria-label="t('calendar.nextMonth')"
          @click="shiftMonth(1)"
        />
      </div>

      <div
        class="grid grid-cols-7 text-center text-[11px] font-medium uppercase text-muted"
        aria-hidden="true"
      >
        <span
          v-for="(label, i) in weekdayLabels"
          :key="i"
          class="py-1"
        >{{ label }}</span>
      </div>

      <div
        class="grid grid-cols-7 gap-1"
        role="grid"
        :aria-label="monthTitle"
        :aria-busy="loading"
      >
        <button
          v-for="day in gridDays"
          :key="day.toISOString()"
          type="button"
          role="gridcell"
          class="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          :class="[
            day.getMonth() !== month.getMonth() ? 'text-dimmed' : 'text-default',
            isSameDay(day, selectedDay)
              ? 'bg-primary text-inverted font-semibold'
              : isSameDay(day, today) ? 'bg-primary/10 text-primary font-semibold ring-1 ring-inset ring-primary/30' : 'hover:bg-elevated'
          ]"
          :aria-selected="isSameDay(day, selectedDay)"
          :aria-label="dayAriaLabel(day)"
          @click="selectedDay = startOfDay(day)"
        >
          <span class="tabular-nums leading-none">{{ day.getDate() }}</span>
          <span class="flex h-1.5 items-center gap-0.5">
            <span
              v-for="dot in loading ? [] : dotsFor(day)"
              :key="dot.type"
              class="size-1.5 rounded-full"
              :class="[TYPE_DOT[dot.type], dot.faded ? 'opacity-40' : '', isSameDay(day, selectedDay) ? 'ring-1 ring-white/70' : '']"
            />
          </span>
        </button>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <span
          v-for="type in (['water', 'fertilize', 'check_in'] as CareTaskType[])"
          :key="type"
          class="inline-flex items-center gap-1.5"
        >
          <span
            class="size-2 rounded-full"
            :class="TYPE_DOT[type]"
          />
          {{ taskLabel(type) }}
        </span>
      </div>
    </section>

    <AppLoadError
      v-if="loadError"
      :description="loadError"
      @retry="load"
    />

    <section
      v-else
      aria-live="polite"
    >
      <h2 class="mb-2 text-sm font-semibold first-letter:uppercase text-highlighted">
        {{ selectedTitle }}
      </h2>

      <div
        v-if="loading"
        class="space-y-2"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-14 rounded-xl"
        />
      </div>

      <p
        v-else-if="!selectedEntries.length"
        class="rounded-xl border border-dashed border-default px-4 py-6 text-center text-sm text-muted"
      >
        {{ t('care.noTasksDay') }}
      </p>

      <ul
        v-else
        class="space-y-2"
      >
        <li
          v-for="entry in selectedEntries"
          :key="entry.id"
        >
          <NuxtLink
            :to="`/plants/${entry.plantId}`"
            class="flex items-center gap-3 rounded-xl border bg-elevated/50 p-2.5 transition-colors hover:bg-elevated"
            :class="[
              entry.status === 'projected' ? 'border-dashed border-default' : 'border-default',
              entry.overdue ? 'border-l-4 border-l-warning' : ''
            ]"
          >
            <PlantsPlantAvatar
              size="sm"
              :name="entry.plant?.name ?? '?'"
              :photo-src="photoFor(entry.plant?.photo_path)"
              :class="entry.status === 'pending' ? '' : 'opacity-70'"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">
                {{ entry.plant?.name }}
              </p>
              <p class="flex items-center gap-1.5 text-xs text-muted">
                <span
                  class="size-2 rounded-full"
                  :class="TYPE_DOT[entry.type]"
                />
                {{ taskLabel(entry.type) }}
              </p>
            </div>
            <span
              class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-success/10 text-success': entry.status === 'done',
                'bg-elevated text-muted ring-1 ring-inset ring-default': entry.status === 'skipped' || entry.status === 'projected',
                'bg-warning/15 text-warning': entry.status === 'pending' && entry.overdue,
                'bg-primary/10 text-primary': entry.status === 'pending' && !entry.overdue
              }"
            >
              <UIcon
                :name="entry.status === 'done' ? 'i-lucide-check' : entry.status === 'skipped' ? 'i-lucide-skip-forward' : entry.status === 'projected' ? 'i-lucide-sparkles' : taskIcon(entry.type)"
                class="size-3.5"
              />
              {{ statusLabel(entry) }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <p
        v-if="!loading && selectedEntries.some(e => e.status === 'projected')"
        class="mt-2 text-xs text-muted"
      >
        {{ t('calendar.projectedHint') }}
      </p>
    </section>
  </div>
</template>
