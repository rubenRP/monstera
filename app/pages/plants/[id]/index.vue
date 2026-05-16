<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { CareTask, HealthStatus } from '#shared/types/database'
import { getHealthColor } from '#shared/constants/plants'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const { healthLabel } = usePlantEnumLabels()
const route = useRoute()
const id = route.params.id as string
const { fetchPlant, updateHealthStatus, deletePlant } = usePlants()
const { fetchPlantPendingTasks, completeTask, skipTask } = useCareTasks()
const toast = useToast()

const skipWaterModalOpen = ref(false)
const taskToSkip = ref<CareTask | null>(null)

const plant = ref<Awaited<ReturnType<typeof fetchPlant>> | null>(null)
const { url: photoUrl } = usePlantPhoto(computed(() => plant.value?.photo_path))
const pendingTasks = ref<Awaited<ReturnType<typeof fetchPlantPendingTasks>>>([])
const loading = ref(true)
const actingTaskId = ref<string | null>(null)
const healthStatus = ref<HealthStatus>('healthy')
const healthNote = ref('')
const activeTab = ref('mi-planta')

const historyTabRef = ref<{ load: () => Promise<void> } | null>(null)
const historyTabVisited = ref(false)

const tabItems = computed<TabsItem[]>(() => [
  { label: t('plants.myPlant'), icon: 'i-lucide-leaf', slot: 'mi-planta', value: 'mi-planta' },
  { label: t('plants.variety'), icon: 'i-lucide-book-open', slot: 'variedad', value: 'variedad' },
  { label: t('plants.history'), icon: 'i-lucide-history', slot: 'historial', value: 'historial' }
])

watch(activeTab, (tab) => {
  if (tab === 'historial' && !historyTabVisited.value) {
    historyTabVisited.value = true
    nextTick(() => historyTabRef.value?.load())
  }
})

onMounted(async () => {
  try {
    plant.value = await fetchPlant(id)
    healthStatus.value = plant.value.health_status
    healthNote.value = plant.value.health_status_note ?? ''
    pendingTasks.value = await fetchPlantPendingTasks(id)
  } finally {
    loading.value = false
  }
})

async function saveHealth() {
  if (!plant.value) return
  try {
    await updateHealthStatus(plant.value.id, healthStatus.value, healthNote.value)
    plant.value.health_status = healthStatus.value
    plant.value.health_status_note = healthNote.value
    toast.add({ title: t('plants.healthUpdated'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  }
}

async function onCompleteTask(taskId: string) {
  const task = pendingTasks.value.find(t => t.id === taskId)
  if (!task) return
  actingTaskId.value = taskId
  try {
    await completeTask(task)
    pendingTasks.value = await fetchPlantPendingTasks(id)
    plant.value = await fetchPlant(id)
    historyTabVisited.value = false
    if (activeTab.value === 'historial') {
      nextTick(() => historyTabRef.value?.load())
    }
  } finally {
    actingTaskId.value = null
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

async function confirmSkip(task: CareTask, soilStillWet: boolean) {
  skipWaterModalOpen.value = false
  taskToSkip.value = null
  actingTaskId.value = task.id
  try {
    const newInterval = await skipTask(task, { soilStillWet })
    pendingTasks.value = await fetchPlantPendingTasks(id)
    plant.value = await fetchPlant(id)
    if (soilStillWet && newInterval) {
      toast.add({
        title: t('home.wateringPlanUpdated'),
        description: t('home.nextWaterIn', { days: newInterval }),
        color: 'success'
      })
    }
    historyTabVisited.value = false
    if (activeTab.value === 'historial') {
      nextTick(() => historyTabRef.value?.load())
    }
  } finally {
    actingTaskId.value = null
  }
}

async function onDelete() {
  if (!confirm(t('plants.deleteConfirm'))) return
  await deletePlant(id)
  await navigateTo('/plants')
}
</script>

<template>
  <div
    v-if="loading"
    class="space-y-4"
  >
    <USkeleton class="h-48 w-full" />
    <USkeleton class="h-8 w-2/3" />
  </div>

  <div
    v-else-if="plant"
    class="space-y-5"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-2xl font-bold">
            {{ plant.name }}
          </h1>
          <span
            class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full text-white"
            :class="getHealthColor(plant.health_status)"
          >
            {{ healthLabel(plant.health_status) }}
          </span>
        </div>
        <p
          v-if="plant.species"
          class="text-muted text-sm mt-0.5"
        >
          {{ plant.species }}
        </p>
      </div>
      <UDropdownMenu
        :items="[[
          { label: t('common.edit'), icon: 'i-lucide-pencil', to: `/plants/${id}/edit` },
          { label: t('common.delete'), icon: 'i-lucide-trash', onSelect: onDelete }
        ]]"
      >
        <UButton
          icon="i-lucide-more-vertical"
          variant="ghost"
          color="neutral"
        />
      </UDropdownMenu>
    </div>

    <img
      v-if="photoUrl"
      :src="photoUrl"
      :alt="plant.name"
      class="w-full h-40 object-cover rounded-xl"
    >

    <div class="grid grid-cols-2 gap-2">
      <UButton
        :to="`/plants/${id}/diagnose`"
        block
        variant="soft"
        icon="i-lucide-stethoscope"
        size="sm"
      >
        {{ t('plants.diagnose') }}
      </UButton>
      <UButton
        :to="`/plants/${id}/recommend`"
        block
        variant="soft"
        icon="i-lucide-cloud-sun"
        size="sm"
      >
        {{ t('plants.recommendations') }}
      </UButton>
    </div>

    <UTabs
      v-model="activeTab"
      :items="tabItems"
      class="w-full"
    >
      <template #mi-planta>
        <PlantsDetailPlantMyInfoTab
          v-model:health-status="healthStatus"
          v-model:health-note="healthNote"
          :plant="plant"
          :pending-tasks="pendingTasks"
          :acting-task-id="actingTaskId"
          @save-health="saveHealth"
          @complete-task="onCompleteTask"
          @skip-task="onSkipClick"
        />
      </template>

      <template #variedad>
        <PlantsDetailPlantSpeciesTab
          :plant-id="id"
          :species="plant.species"
        />
      </template>

      <template #historial>
        <PlantsDetailPlantCareHistoryTab
          ref="historyTabRef"
          :plant-id="id"
        />
      </template>
    </UTabs>

    <CareSkipWaterModal
      v-model:open="skipWaterModalOpen"
      v-model:task="taskToSkip"
      @confirm="onSkipWaterConfirm"
    />
  </div>
</template>
