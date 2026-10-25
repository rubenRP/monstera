<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { CareTask, PlantArchiveReason } from '#shared/types/database'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const { archiveReasonLabel } = usePlantEnumLabels()
const { dateLocale } = useDateLocale()
const route = useRoute()
const id = route.params.id as string
const { fetchPlant, deletePlant, archivePlant, unarchivePlant, movePlantToSite } = usePlants()
const {
  fetchPlantPendingTasks,
  completeTask,
  skipTask,
  postponeTask,
  requiresCheckInModal,
  taskLabel
} = useCareTasks()
const { submitCheckIn } = usePlantCheckIns()
const toast = useToast()

const skipWaterModalOpen = ref(false)
const checkInModalOpen = ref(false)
const taskToCheckIn = ref<CareTask | null>(null)
const checkInModalRef = ref<{ setSaving: (v: boolean) => void } | null>(null)
const archiveModalOpen = ref(false)
const moveSiteModalOpen = ref(false)
const moveSiteLoading = ref(false)
const taskToSkip = ref<CareTask | null>(null)

const plant = ref<Awaited<ReturnType<typeof fetchPlant>> | null>(null)
usePageTitle(() => plant.value?.name)
const { url: photoUrl } = usePlantPhoto(computed(() => plant.value?.photo_path))
const pendingTasks = ref<Awaited<ReturnType<typeof fetchPlantPendingTasks>>>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const notFound = ref(false)
const actingTaskId = ref<string | null>(null)
const router = useRouter()
const TAB_VALUES = ['mi-planta', 'variedad', 'historial'] as const
/** Selected tab lives in ?tab= so going back (or reloading) keeps it. */
const activeTab = computed({
  get: () => {
    const tab = route.query.tab
    return typeof tab === 'string' && (TAB_VALUES as readonly string[]).includes(tab) ? tab : 'mi-planta'
  },
  set: (value: string) => {
    void router.replace({ query: { ...route.query, tab: value === 'mi-planta' ? undefined : value } })
  }
})
const deleteModalOpen = ref(false)
const deleting = ref(false)
const unarchiving = ref(false)

const historyTabRef = ref<{ load: () => Promise<void> } | null>(null)

const isArchived = computed(() => !!plant.value?.archived_at)

const archivedOnLabel = computed(() => {
  if (!plant.value?.archived_at) return ''
  return new Date(plant.value.archived_at).toLocaleDateString(dateLocale.value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const pendingByType = computed(() => ({
  water: pendingTasks.value.find(task => task.type === 'water') ?? null,
  fertilize: pendingTasks.value.find(task => task.type === 'fertilize') ?? null,
  check_in: pendingTasks.value.find(task => task.type === 'check_in') ?? null
}))

const quickActions = computed(() => [
  { key: 'water', label: t('plants.quickWater'), icon: 'i-lucide-droplets', task: pendingByType.value.water },
  { key: 'fertilize', label: t('plants.quickFertilize'), icon: 'i-lucide-flask-conical', task: pendingByType.value.fertilize },
  { key: 'check_in', label: t('plants.quickCheckIn'), icon: 'i-lucide-clipboard-check', task: pendingByType.value.check_in }
])

const menuItems = computed(() => {
  const items: Array<{ label: string, icon: string, to?: string, color?: 'error', onSelect?: () => void }> = []
  if (!isArchived.value) {
    items.push(
      { label: t('plants.recommendations'), icon: 'i-lucide-cloud-sun', to: `/plants/${id}/recommend` },
      { label: t('common.edit'), icon: 'i-lucide-pencil', to: `/plants/${id}/edit` },
      { label: t('plants.moveSite'), icon: 'i-lucide-map-pin', onSelect: () => { moveSiteModalOpen.value = true } },
      { label: t('plants.archive'), icon: 'i-lucide-archive', onSelect: () => { archiveModalOpen.value = true } }
    )
  }
  if (isArchived.value) {
    items.push({
      label: t('plants.unarchive'),
      icon: 'i-lucide-archive-restore',
      onSelect: () => { void onUnarchive() }
    })
  }
  items.push({
    label: t('common.delete'),
    icon: 'i-lucide-trash',
    color: 'error' as const,
    onSelect: () => { deleteModalOpen.value = true }
  })
  return [items]
})

const tabItems = computed<TabsItem[]>(() => [
  { label: t('plants.myPlant'), icon: 'i-lucide-leaf', slot: 'mi-planta', value: 'mi-planta' },
  { label: t('plants.variety'), icon: 'i-lucide-book-open', slot: 'variedad', value: 'variedad' },
  { label: t('plants.history'), icon: 'i-lucide-history', slot: 'historial', value: 'historial' }
])

function refreshCareHistory() {
  nextTick(() => historyTabRef.value?.load())
}

async function loadPlant() {
  loading.value = true
  loadError.value = null
  notFound.value = false
  try {
    plant.value = await fetchPlant(id)
    if (!plant.value.archived_at) {
      pendingTasks.value = await fetchPlantPendingTasks(id)
    }
  } catch (e: unknown) {
    // PGRST116: no rows for .single() (unknown id / other user's plant); 22P02: malformed uuid
    const code = (e as { code?: string })?.code
    if (code === 'PGRST116' || code === '22P02') {
      notFound.value = true
    } else {
      loadError.value = apiErrorMessage(e)
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadPlant)

function openCheckIn() {
  const task = pendingByType.value.check_in
  if (!task) return
  taskToCheckIn.value = task
  checkInModalOpen.value = true
}

async function onCompleteTask(task: CareTask) {
  if (requiresCheckInModal(task.type)) {
    taskToCheckIn.value = task
    checkInModalOpen.value = true
    return
  }
  actingTaskId.value = task.id
  try {
    await completeTask(task)
    pendingTasks.value = await fetchPlantPendingTasks(id)
    plant.value = await fetchPlant(id)
    refreshCareHistory()
    if (import.meta.client && 'vibrate' in navigator) navigator.vibrate(12)
    toast.add({ title: t('home.taskDoneToast', { task: taskLabel(task.type) }), color: 'success', icon: 'i-lucide-check' })
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    actingTaskId.value = null
  }
}

async function onCheckInSubmit(
  form: import('#shared/utils/checkIn/schemas').CheckInFormInput,
  photo?: File
) {
  const task = taskToCheckIn.value
  if (!task) return
  actingTaskId.value = task.id
  checkInModalRef.value?.setSaving(true)
  try {
    await submitCheckIn(task, form, photo)
    checkInModalOpen.value = false
    taskToCheckIn.value = null
    pendingTasks.value = await fetchPlantPendingTasks(id)
    plant.value = await fetchPlant(id)
    refreshCareHistory()
    toast.add({ title: t('checkIn.saved'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    checkInModalRef.value?.setSaving(false)
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
    refreshCareHistory()
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    actingTaskId.value = null
  }
}

async function onPostpone(task: CareTask, days: number) {
  actingTaskId.value = task.id
  try {
    await postponeTask(task, days)
    pendingTasks.value = await fetchPlantPendingTasks(id)
    toast.add({ title: t('home.postponedToast', { days }, days), color: 'success', icon: 'i-lucide-clock' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    actingTaskId.value = null
  }
}

async function onMoveSiteConfirm(siteId: string | null) {
  if (!plant.value) return
  moveSiteLoading.value = true
  try {
    const updated = await movePlantToSite(plant.value.id, siteId)
    plant.value = updated
    pendingTasks.value = await fetchPlantPendingTasks(id)
    moveSiteModalOpen.value = false
    const siteName = updated.site?.name
    toast.add({
      title: siteName
        ? t('plants.moveSiteSuccess', { site: siteName })
        : t('plants.moveSiteSuccessNoSite'),
      color: 'success'
    })
    refreshCareHistory()
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    moveSiteLoading.value = false
  }
}

async function onArchiveConfirm(reason: PlantArchiveReason) {
  archiveModalOpen.value = false
  try {
    await archivePlant(id, reason)
    toast.add({ title: t('plants.archiveSuccess'), color: 'success' })
    await navigateTo('/plants')
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deletePlant(id)
    deleteModalOpen.value = false
    toast.add({ title: t('plants.deleted'), color: 'success' })
    await navigateTo('/plants')
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    deleting.value = false
  }
}

async function onUnarchive() {
  unarchiving.value = true
  try {
    plant.value = await unarchivePlant(id)
    pendingTasks.value = await fetchPlantPendingTasks(id)
    toast.add({ title: t('plants.unarchived'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    unarchiving.value = false
  }
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

  <AppLoadError
    v-else-if="loadError"
    :description="loadError"
    @retry="loadPlant"
  />

  <UAlert
    v-else-if="notFound"
    icon="i-lucide-sprout"
    :title="t('plants.notFoundTitle')"
    :description="t('plants.notFoundDescription')"
  >
    <template #actions>
      <UButton
        to="/plants"
        size="sm"
        icon="i-lucide-leaf"
      >
        {{ t('plants.backToList') }}
      </UButton>
    </template>
  </UAlert>

  <div
    v-else-if="plant"
    class="space-y-5"
  >
    <PlantsDetailPlantDetailHero
      :plant="plant"
      :photo-src="photoUrl"
      :menu-items="menuItems"
    />

    <UAlert
      v-if="isArchived && plant.archive_reason"
      color="neutral"
      variant="subtle"
      icon="i-lucide-archive"
      :title="t('plants.archivedBanner', { reason: archiveReasonLabel(plant.archive_reason) })"
      :description="t('plants.archivedOn', { date: archivedOnLabel })"
    >
      <template #actions>
        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          icon="i-lucide-archive-restore"
          :loading="unarchiving"
          @click="onUnarchive"
        >
          {{ t('plants.unarchive') }}
        </UButton>
      </template>
    </UAlert>

    <div
      v-if="!isArchived"
      class="grid grid-cols-4 gap-2"
    >
      <button
        v-for="action in quickActions"
        :key="action.key"
        type="button"
        class="flex flex-col items-center gap-1.5 rounded-2xl border border-default bg-elevated/50 px-1 py-3 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary"
        :disabled="!action.task || actingTaskId === action.task.id"
        @click="action.task && onCompleteTask(action.task)"
      >
        <span class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UIcon
            v-if="!(action.task && actingTaskId === action.task.id)"
            :name="action.icon"
            class="size-5"
          />
          <UIcon
            v-else
            name="i-lucide-loader-circle"
            class="size-5 animate-spin"
          />
        </span>
        {{ action.label }}
      </button>
      <NuxtLink
        :to="`/plants/${id}/diagnose`"
        class="flex flex-col items-center gap-1.5 rounded-2xl border border-default bg-elevated/50 px-1 py-3 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UIcon
            name="i-lucide-stethoscope"
            class="size-5"
          />
        </span>
        {{ t('plants.diagnose') }}
      </NuxtLink>
    </div>

    <PlantsDetailPlantCareStatusCard
      v-if="!isArchived"
      :plant="plant"
      :pending-tasks="pendingTasks"
      :acting-task-id="actingTaskId"
      @complete="onCompleteTask"
      @skip="onSkipClick"
      @postpone="onPostpone"
    />

    <UTabs
      v-model="activeTab"
      :items="tabItems"
      class="w-full"
    >
      <template #mi-planta>
        <PlantsDetailPlantMyInfoTab
          :plant="plant"
          :read-only="isArchived"
          @check-in="openCheckIn"
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

    <CareCheckInModal
      ref="checkInModalRef"
      v-model:open="checkInModalOpen"
      v-model:task="taskToCheckIn"
      @submit="onCheckInSubmit"
    />

    <PlantsPlantArchiveModal
      v-model:open="archiveModalOpen"
      @confirm="onArchiveConfirm"
    />

    <AppConfirmModal
      v-model:open="deleteModalOpen"
      :title="t('plants.deleteTitle', { name: plant.name })"
      :description="isArchived ? t('plants.deleteConfirmArchived') : t('plants.deleteConfirmLong')"
      :confirm-label="t('common.delete')"
      :loading="deleting"
      @confirm="confirmDelete"
    />

    <PlantsPlantMoveSiteModal
      v-if="plant"
      v-model:open="moveSiteModalOpen"
      :plant="plant"
      :loading="moveSiteLoading"
      @confirm="onMoveSiteConfirm"
    />
  </div>
</template>
