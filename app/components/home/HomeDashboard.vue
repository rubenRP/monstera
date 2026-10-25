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
const visibleTasks = computed(() => tasks.value.filter(task => !deferredTaskIds.value.has(task.id)))
const visibleSummaryTasks = computed(() => summaryTasks.value.filter(task => !deferredTaskIds.value.has(task.id)))

const todayTasksInView = computed(() => [...tasks.value, ...completedToday.value])

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

async function markDone(taskId: string) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return
  if (requiresCheckInModal(task.type)) {
    taskToCheckIn.value = task
    checkInModalOpen.value = true
    return
  }
  deferWithUndo(task, t('home.taskDoneToast', { task: taskLabel(task.type) }), async () => {
    await completeTask(task)
    await Promise.all([reloadTasks(), fetchRecentEvents()])
  })
}

/** Hides the task now, commits after the undo window; the toast offers "Undo" meanwhile. */
function deferWithUndo(task: CareTask, title: string, run: () => Promise<void>) {
  scheduleDeferred(task.id, async () => {
    try {
      await run()
    } catch (e: unknown) {
      toast.add({
        title: t('common.error'),
        description: apiErrorMessage(e),
        color: 'error'
      })
      await reloadTasks()
    }
  })
  toast.add({
    id: `undo-${task.id}`,
    title,
    description: task.plant?.name,
    color: 'success',
    icon: 'i-lucide-check',
    duration: UNDO_WINDOW_MS,
    actions: [{
      label: t('common.undo'),
      icon: 'i-lucide-undo-2',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cancelDeferred(task.id)
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
  deferWithUndo(task, t('home.taskSkippedToast', { task: taskLabel(task.type) }), async () => {
    const newInterval = await skipTask(task, { soilStillWet })
    await Promise.all([reloadTasks(), fetchRecentEvents()])
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
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-16"
      />
    </div>

    <AppLoadError
      v-else-if="loadError"
      :description="loadError"
      @retry="initialLoad"
    />

    <template v-else-if="!plants.length">
      <UAlert
        color="primary"
        variant="subtle"
        icon="i-lucide-leaf"
        :title="t('home.emptyTitle')"
        :description="t('home.emptyDescription')"
      >
        <template #actions>
          <UButton
            to="/plants/new"
            size="sm"
            icon="i-lucide-plus"
          >
            {{ t('home.addPlant') }}
          </UButton>
        </template>
      </UAlert>
    </template>

    <template v-else>
      <div class="flex items-center justify-between gap-3 mb-4">
        <span class="text-sm font-medium">{{ t('home.showUpcomingTasks') }}</span>
        <USwitch v-model="showUpcoming" />
      </div>

      <div
        v-if="tasksLoading"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 2"
          :key="i"
          class="h-16"
        />
      </div>

      <UAlert
        v-else-if="!visibleTasks.length && (showUpcoming || !completedToday.length)"
        color="neutral"
        icon="i-lucide-check-circle"
        :title="t('home.allCaughtUp')"
        :description="showUpcoming ? t('home.noTasksUpcoming') : t('home.noTasksToday')"
      />

      <UButton
        v-if="!tasksLoading && plants.length"
        class="mb-3"
        block
        variant="soft"
        icon="i-lucide-droplets"
        :disabled="!plantsForAdvanceWater.length"
        @click="() => { addWaterModalOpen = true }"
      >
        {{ t('home.addAdvanceWater') }}
      </UButton>

      <HomeTaskList
        :tasks="visibleTasks"
        :completed="completedToday"
        :context-tasks="todayTasksInView"
        :show-upcoming="showUpcoming"
        :acting="acting"
        :loading="tasksLoading"
        @done="markDone"
        @skip="onSkipClick"
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
