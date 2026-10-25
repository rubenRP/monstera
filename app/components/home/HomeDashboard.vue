<script setup lang="ts">
import type { CareTask } from '#shared/types/database'
import { excludePendingResolvedToday } from '#shared/utils/care/resolvedToday'

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const UPCOMING_STORAGE_KEY = 'monstera_home_upcoming_tasks'

const {
  fetchTodayTasks,
  fetchTodayCompletedTasks,
  fetchUpcomingTasks,
  createAdvanceTask,
  completeTask,
  skipTask,
  postponeTask,
  requiresCheckInModal,
  overdueDays,
  taskLabel
} = useCareTasks()
const { submitCheckIn } = usePlantCheckIns()
const { fetchPlants } = usePlants()
const {
  events: recalcEvents,
  fetchRecentEvents,
  dismissEvent,
  dismissAll: dismissAllRecalcEvents
} = useWateringRecalcEvents()
const { apiErrorMessage } = useApiError()
const toast = useToast()
const {
  pendingIds: deferredTaskIds,
  schedule: scheduleDeferred,
  cancel: cancelDeferred
} = useDeferredActions()
const { urlFor: photoFor, ensure: ensurePhotoUrls } = usePlantPhotoUrls()
const { setCount: setTodayTaskCount } = useTodayTaskCount()
const route = useRoute()
const router = useRouter()

const tasks = ref<Awaited<ReturnType<typeof fetchTodayTasks>>>([])
const summaryTasks = ref<Awaited<ReturnType<typeof fetchTodayTasks>>>([])
const completedToday = ref<Awaited<ReturnType<typeof fetchTodayCompletedTasks>>>([])
const plants = ref<Awaited<ReturnType<typeof fetchPlants>>>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const acting = ref<string | null>(null)
const skipWaterModalOpen = ref(false)
const checkInModalOpen = ref(false)
const taskToSkip = ref<CareTask | null>(null)
const taskToCheckIn = ref<CareTask | null>(null)
const checkInModalRef = ref<{ setSaving: (v: boolean) => void } | null>(null)
const addWaterModalOpen = ref(false)
const addingWater = ref(false)
const showUpcoming = ref(false)
const tasksLoading = ref(false)

const todayFormatted = computed(() =>
  new Date().toLocaleDateString(dateLocale.value, { weekday: 'long', day: 'numeric', month: 'long' })
)

/** Tasks inside the undo window are hidden until committed or restored. */
const hiddenTaskIds = computed(() => new Set([...deferredTaskIds.value].flatMap(key => key.split(','))))
const visibleTasks = computed(() => tasks.value.filter(task => !hiddenTaskIds.value.has(task.id)))
const visibleSummaryTasks = computed(() => summaryTasks.value.filter(task => !hiddenTaskIds.value.has(task.id)))

const todayTasksInView = computed(() => [...tasks.value, ...completedToday.value])

const viewTabs = computed(() => [
  { label: t('home.tabToday'), value: 'today' },
  { label: t('home.showUpcomingTasks'), value: 'upcoming' }
])
const view = computed({
  get: () => (showUpcoming.value ? 'upcoming' : 'today'),
  set: (value: string) => {
    showUpcoming.value = value === 'upcoming'
  }
})

watch(todayTasksInView, (list) => {
  void ensurePhotoUrls(list.map(task => task.plant?.photo_path))
})

watch(visibleSummaryTasks, (list) => {
  if (!loading.value) setTodayTaskCount(list.length)
})

/** Quick actions from the global "+" menu land here as ?action=… */
watch(() => route.query.action, (action) => {
  if (action !== 'advance-water') return
  addWaterModalOpen.value = true
  void router.replace({ query: { ...route.query, action: undefined } })
}, { immediate: true })

const plantIdsWithWaterInView = computed(
  () => new Set(
    todayTasksInView.value
      .filter(task => task.type === 'water')
      .map(task => task.plant_id)
  )
)

const plantsForAdvanceWater = computed(() =>
  plants.value.filter(p => !plantIdsWithWaterInView.value.has(p.id))
)

async function loadTasks() {
  if (showUpcoming.value) {
    const [todayPending, upcoming] = await Promise.all([
      fetchTodayTasks(),
      fetchUpcomingTasks()
    ])
    summaryTasks.value = todayPending
    tasks.value = upcoming
    completedToday.value = []
    return
  }
  const [pending, completed] = await Promise.all([
    fetchTodayTasks(),
    fetchTodayCompletedTasks()
  ])
  const visiblePending = excludePendingResolvedToday(pending, completed)
  summaryTasks.value = visiblePending
  tasks.value = visiblePending
  completedToday.value = completed
}

const overdueTaskCount = computed(
  () => visibleSummaryTasks.value.filter(task => overdueDays(task.due_at) > 0).length
)

const todayTaskCount = computed(
  () => visibleSummaryTasks.value.filter(task => overdueDays(task.due_at) <= 0).length
)

async function reloadTasks() {
  tasksLoading.value = true
  try {
    await loadTasks()
  } catch (e: unknown) {
    toast.add({
      title: t('common.loadErrorTitle'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    tasksLoading.value = false
  }
}

async function initialLoad() {
  loading.value = true
  loadError.value = null
  try {
    plants.value = await fetchPlants()
    await Promise.all([loadTasks(), fetchRecentEvents()])
    setTodayTaskCount(visibleSummaryTasks.value.length)
  } catch (e: unknown) {
    loadError.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (import.meta.client) {
    showUpcoming.value = localStorage.getItem(UPCOMING_STORAGE_KEY) === '1'
  }
  await initialLoad()
})

watch(showUpcoming, (value) => {
  if (import.meta.client) {
    localStorage.setItem(UPCOMING_STORAGE_KEY, value ? '1' : '0')
  }
  if (!loading.value) void reloadTasks()
})

function markDone(task: CareTask) {
  if (requiresCheckInModal(task.type)) {
    taskToCheckIn.value = task
    checkInModalOpen.value = true
    return
  }
  deferWithUndo([task], t('home.taskDoneToast', { task: taskLabel(task.type) }), async () => {
    await completeTask(task)
  })
}

function onDoneGroup(group: CareTask[]) {
  if (!group.length) return
  deferWithUndo(group, t('home.groupDoneToast', { count: group.length }), async () => {
    // Sequential: each completion reschedules fertilizing for its plant
    for (const task of group) await completeTask(task)
  })
}

function onPostpone(task: CareTask, days: number) {
  deferWithUndo([task], t('home.postponedToast', { days }, days), async () => {
    await postponeTask(task, days)
  })
}

/**
 * Hides the tasks now and commits after the undo window; the toast offers "Undo" meanwhile.
 * All tasks share one deferred action so undo restores the whole group.
 */
function deferWithUndo(group: CareTask[], title: string, run: () => Promise<void>) {
  const key = group.map(task => task.id).join(',')
  scheduleDeferred(key, async () => {
    try {
      await run()
    } catch (e: unknown) {
      toast.add({
        title: t('common.error'),
        description: apiErrorMessage(e),
        color: 'error'
      })
    }
    await Promise.all([reloadTasks(), fetchRecentEvents()])
  })
  toast.add({
    id: `undo-${key}`,
    title,
    description: group.length === 1 ? group[0]!.plant?.name : undefined,
    color: 'success',
    icon: 'i-lucide-check',
    duration: UNDO_WINDOW_MS,
    actions: [{
      label: t('common.undo'),
      icon: 'i-lucide-undo-2',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cancelDeferred(key)
      }
    }]
  })
}

async function onCheckInSubmit(
  form: import('#shared/utils/checkIn/schemas').CheckInFormInput,
  photo?: File
) {
  const task = taskToCheckIn.value
  if (!task) return
  acting.value = task.id
  checkInModalRef.value?.setSaving(true)
  try {
    await submitCheckIn(task, form, photo)
    checkInModalOpen.value = false
    taskToCheckIn.value = null
    await reloadTasks()
    toast.add({ title: t('checkIn.saved'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    checkInModalRef.value?.setSaving(false)
    acting.value = null
  }
}

function onSkipClick(task: CareTask) {
  if (task.type === 'water') {
    taskToSkip.value = task
    skipWaterModalOpen.value = true
    return
  }
  confirmSkip(task, false)
}

function onSkipWaterConfirm(soilStillWet: boolean) {
  const task = taskToSkip.value
  if (!task) return
  confirmSkip(task, soilStillWet)
}

async function onAddAdvanceWater(plantId: string) {
  addingWater.value = true
  try {
    const created = await createAdvanceTask(plantId)
    if (!created) {
      toast.add({
        title: t('care.addAdvanceWaterAlready'),
        color: 'warning'
      })
      return
    }
    await reloadTasks()
    addWaterModalOpen.value = false
    toast.add({
      title: t('care.addAdvanceWaterSuccess'),
      description: created.plant?.name,
      color: 'success'
    })
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    addingWater.value = false
  }
}

function confirmSkip(task: CareTask, soilStillWet: boolean) {
  skipWaterModalOpen.value = false
  taskToSkip.value = null
  deferWithUndo([task], t('home.taskSkippedToast', { task: taskLabel(task.type) }), async () => {
    const newInterval = await skipTask(task, { soilStillWet })
    if (soilStillWet && newInterval) {
      toast.add({
        title: t('home.wateringPlanUpdated'),
        description: t('home.nextWaterIn', { days: newInterval }),
        color: 'success'
      })
    }
  })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-highlighted">
        {{ t('home.title') }}
      </h1>
      <p class="text-muted text-sm">
        {{ todayFormatted }}
      </p>
    </div>

    <HomePlantSummary
      v-if="!loading && plants.length > 0"
      :plants="plants"
      :today-task-count="todayTaskCount"
      :overdue-task-count="overdueTaskCount"
    />

    <HomeWateringRecalcWidget
      v-if="!loading && recalcEvents.length"
      :events="recalcEvents"
      @dismiss="dismissEvent"
      @dismiss-all="dismissAllRecalcEvents"
    />

    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton class="h-36 rounded-2xl" />
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-[68px] rounded-2xl"
      />
    </div>

    <AppLoadError
      v-else-if="loadError"
      :description="loadError"
      @retry="initialLoad"
    />

    <template v-else-if="!plants.length">
      <AppEmptyState
        :title="t('home.emptyTitle')"
        :description="t('home.emptyDescription')"
      >
        <UButton
          to="/plants/new"
          icon="i-lucide-plus"
        >
          {{ t('home.addPlant') }}
        </UButton>
      </AppEmptyState>
    </template>

    <template v-else>
      <UTabs
        v-model="view"
        :items="viewTabs"
        :content="false"
        size="sm"
        class="w-full"
      />

      <div
        v-if="tasksLoading"
        class="space-y-2"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-[68px] rounded-2xl"
        />
      </div>

      <AppEmptyState
        v-else-if="!visibleTasks.length"
        illustration="done"
        :title="t('home.allCaughtUp')"
        :description="showUpcoming ? t('home.noTasksUpcoming') : t('home.noTasksToday')"
      />

      <HomeTaskList
        :tasks="visibleTasks"
        :completed="completedToday"
        :context-tasks="todayTasksInView"
        :show-upcoming="showUpcoming"
        :acting="acting"
        :loading="tasksLoading"
        :photo-for="photoFor"
        @done="markDone"
        @done-group="onDoneGroup"
        @skip="onSkipClick"
        @postpone="onPostpone"
      />
    </template>

    <CareSkipWaterModal
      v-model:open="skipWaterModalOpen"
      v-model:task="taskToSkip"
      @confirm="onSkipWaterConfirm"
    />

    <CareAddAdvanceWaterModal
      v-model:open="addWaterModalOpen"
      :plants="plantsForAdvanceWater"
      :loading="addingWater"
      @submit="onAddAdvanceWater"
    />

    <CareCheckInModal
      ref="checkInModalRef"
      v-model:open="checkInModalOpen"
      v-model:task="taskToCheckIn"
      @submit="onCheckInSubmit"
    />
  </div>
</template>
