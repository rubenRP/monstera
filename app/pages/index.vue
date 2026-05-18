<script setup lang="ts">
import type { CareTask, HealthStatus } from '#shared/types/database'

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
  taskLabel,
  taskIcon,
  overdueDays,
  overdueLabel,
  taskDueLabel,
  fertilizeWithWater
} = useCareTasks()
const { fetchPlants } = usePlants()
const toast = useToast()

const tasks = ref<Awaited<ReturnType<typeof fetchTodayTasks>>>([])
const completedToday = ref<Awaited<ReturnType<typeof fetchTodayCompletedTasks>>>([])
const plants = ref<Awaited<ReturnType<typeof fetchPlants>>>([])
const loading = ref(true)
const acting = ref<string | null>(null)
const skipWaterModalOpen = ref(false)
const taskToSkip = ref<CareTask | null>(null)
const addWaterModalOpen = ref(false)
const addingWater = ref(false)
const showUpcoming = ref(false)
const tasksLoading = ref(false)

const healthSummary = computed(() => {
  const counts: Record<HealthStatus, number> = {
    healthy: 0,
    fair: 0,
    sick: 0,
    critical: 0
  }
  for (const p of plants.value) {
    counts[p.health_status]++
  }
  return counts
})

const todayFormatted = computed(() =>
  new Date().toLocaleDateString(dateLocale.value, { weekday: 'long', day: 'numeric', month: 'long' })
)

const plantIdsWithWaterInView = computed(
  () => new Set([
    ...tasks.value.filter(task => task.type === 'water').map(task => task.plant_id),
    ...completedToday.value.filter(task => task.type === 'water').map(task => task.plant_id)
  ])
)

const plantsForAdvanceWater = computed(() =>
  plants.value.filter(p => !plantIdsWithWaterInView.value.has(p.id))
)

async function loadTasks() {
  if (showUpcoming.value) {
    tasks.value = await fetchUpcomingTasks()
    completedToday.value = []
    return
  }
  const [pending, completed] = await Promise.all([
    fetchTodayTasks(),
    fetchTodayCompletedTasks()
  ])
  tasks.value = pending
  completedToday.value = completed
}

async function reloadTasks() {
  tasksLoading.value = true
  try {
    await loadTasks()
  } finally {
    tasksLoading.value = false
  }
}

onMounted(async () => {
  if (import.meta.client) {
    showUpcoming.value = localStorage.getItem(UPCOMING_STORAGE_KEY) === '1'
  }
  try {
    plants.value = await fetchPlants()
    await loadTasks()
  } finally {
    loading.value = false
  }
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
  acting.value = taskId
  try {
    await completeTask(task)
    await reloadTasks()
  } finally {
    acting.value = null
  }
}

function onSkipClick(task: CareTask) {
  if (task.type === 'water') {
    taskToSkip.value = task
    skipWaterModalOpen.value = true
    return
  }
  void confirmSkip(task, false)
}

function onSkipWaterConfirm(soilStillWet: boolean) {
  const task = taskToSkip.value
  if (!task) return
  void confirmSkip(task, soilStillWet)
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
  } catch {
    toast.add({
      title: t('common.error'),
      color: 'error'
    })
  } finally {
    addingWater.value = false
  }
}

async function confirmSkip(task: CareTask, soilStillWet: boolean) {
  skipWaterModalOpen.value = false
  taskToSkip.value = null
  acting.value = task.id
  try {
    const newInterval = await skipTask(task, { soilStillWet })
    await reloadTasks()
    if (soilStillWet && newInterval) {
      toast.add({
        title: t('home.wateringPlanUpdated'),
        description: t('home.nextWaterIn', { days: newInterval }),
        color: 'success'
      })
    }
  } finally {
    acting.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        {{ t('home.title') }}
      </h1>
      <p class="text-muted text-sm">
        {{ todayFormatted }}
      </p>
    </div>

    <UCard v-if="!loading && (healthSummary.sick > 0 || healthSummary.critical > 0 || healthSummary.fair > 0)">
      <template #header>
        <span class="font-medium">{{ t('home.plantSummary') }}</span>
      </template>
      <div class="flex flex-wrap gap-2 text-sm">
        <UBadge
          v-if="healthSummary.critical > 0"
          color="error"
        >
          {{ healthSummary.critical === 1
            ? t('home.healthCriticalOne')
            : t('home.healthCriticalMany', { count: healthSummary.critical }) }}
        </UBadge>
        <UBadge
          v-if="healthSummary.sick > 0"
          color="warning"
        >
          {{ healthSummary.sick === 1
            ? t('home.healthSickOne')
            : t('home.healthSickMany', { count: healthSummary.sick }) }}
        </UBadge>
        <UBadge
          v-if="healthSummary.fair > 0"
          color="warning"
          variant="subtle"
        >
          {{ healthSummary.fair === 1
            ? t('home.healthFairOne')
            : t('home.healthFairMany', { count: healthSummary.fair }) }}
        </UBadge>
        <UBadge
          v-if="healthSummary.healthy > 0"
          color="success"
          variant="subtle"
        >
          {{ t('home.healthHealthy', { count: healthSummary.healthy }) }}
        </UBadge>
      </div>
    </UCard>

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
        v-else-if="!tasks.length && (showUpcoming || !completedToday.length)"
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
        @click="addWaterModalOpen = true"
      >
        {{ t('home.addAdvanceWater') }}
      </UButton>

      <ul
        v-if="!tasksLoading && tasks.length"
        class="space-y-3"
      >
        <li
          v-for="task in tasks"
          :key="task.id"
          class="p-4 rounded-xl border bg-elevated/30"
          :class="overdueDays(task.due_at) > 0 ? 'border-warning/50' : 'border-default'"
        >
          <div class="flex items-start gap-3">
            <UIcon
              :name="taskIcon(task.type)"
              class="w-5 h-5 mt-0.5 shrink-0"
              :class="overdueDays(task.due_at) > 0 ? 'text-warning' : 'text-primary'"
            />
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="`/plants/${task.plant_id}`"
                class="font-medium hover:text-primary"
              >
                {{ task.plant?.name }}
              </NuxtLink>
              <p class="text-sm text-muted">
                {{ taskLabel(task.type) }}
                <span v-if="fertilizeWithWater(task, tasks)"> · {{ t('care.fertilizeWithWater') }}</span>
                <span v-if="task.plant?.site?.name"> · {{ task.plant.site.name }}</span>
              </p>
              <p
                v-if="overdueDays(task.due_at) > 0"
                class="text-sm text-warning mt-0.5"
              >
                {{ overdueLabel(task.due_at) }}
              </p>
              <p
                v-else-if="showUpcoming"
                class="text-sm text-muted mt-0.5"
              >
                {{ taskDueLabel(task.due_at) }}
              </p>
            </div>
            <div class="flex gap-1 shrink-0">
              <UButton
                size="xs"
                color="primary"
                :loading="acting === task.id"
                @click="markDone(task.id)"
              >
                {{ t('common.done') }}
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                :loading="acting === task.id"
                @click="onSkipClick(task)"
              >
                {{ t('common.skip') }}
              </UButton>
            </div>
          </div>
        </li>
      </ul>

      <div
        v-if="!tasksLoading && !showUpcoming && completedToday.length"
        class="space-y-3 mt-6"
      >
        <h2 class="text-sm font-medium text-muted">
          {{ t('home.completedToday') }}
        </h2>
        <ul class="space-y-3">
          <li
            v-for="task in completedToday"
            :key="task.id"
            class="p-4 rounded-xl border border-success/30 bg-success/5"
          >
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-circle-check"
                class="w-5 h-5 mt-0.5 shrink-0 text-success"
              />
              <div class="flex-1 min-w-0">
                <NuxtLink
                  :to="`/plants/${task.plant_id}`"
                  class="font-medium hover:text-primary"
                >
                  {{ task.plant?.name }}
                </NuxtLink>
                <p class="text-sm text-muted">
                  {{ taskLabel(task.type) }}
                  <span v-if="fertilizeWithWater(task, tasks)"> · {{ t('care.fertilizeWithWater') }}</span>
                  <span v-if="task.plant?.site?.name"> · {{ task.plant.site.name }}</span>
                </p>
              </div>
              <UBadge
                color="success"
                size="sm"
                variant="subtle"
              >
                {{ t('common.done') }}
              </UBadge>
            </div>
          </li>
        </ul>
      </div>
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
  </div>
</template>
