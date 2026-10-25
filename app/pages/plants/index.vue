<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'

const { t } = useI18n()
const { healthOptions } = usePlantEnumLabels()
const { fetchPlants } = usePlants()
const { fetchPendingDueByPlant } = useCareTasks()
const { urlFor: photoFor, ensure: ensurePhotoUrls } = usePlantPhotoUrls()
const plants = ref<Awaited<ReturnType<typeof fetchPlants>>>([])
const nextWaterByPlant = ref<Map<string, string>>(new Map())
const VIEW_STORAGE_KEY = 'monstera_plants_view'
const viewMode = ref<'grid' | 'list'>('grid')
const loading = ref(true)
const loadError = ref<string | null>(null)
const { apiErrorMessage } = useApiError()
const filter = ref<HealthStatus | 'all'>('all')
const listTab = ref<'active' | 'archived'>('active')

const tabItems = computed(() => [
  { label: t('plants.tabActive'), value: 'active' },
  { label: t('plants.tabArchived'), value: 'archived' }
])

const filterItems = computed(() => [
  { label: t('plants.filterAll'), value: 'all' },
  ...healthOptions.value.map(o => ({ label: o.label, value: o.value }))
])

const showHealthFilter = computed(() => listTab.value === 'active')

async function load() {
  loading.value = true
  loadError.value = null
  try {
    plants.value = await fetchPlants({
      archived: listTab.value,
      filterStatus: showHealthFilter.value && filter.value !== 'all' ? filter.value : undefined
    })
    const [dueMap] = await Promise.all([
      listTab.value === 'active' ? fetchPendingDueByPlant('water') : Promise.resolve(new Map<string, string>()),
      ensurePhotoUrls(plants.value.map(p => p.photo_path))
    ])
    nextWaterByPlant.value = dueMap
  } catch (e: unknown) {
    plants.value = []
    loadError.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch([filter, listTab], load)
watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  } catch { /* private mode */ }
})
onMounted(() => {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    if (saved === 'list' || saved === 'grid') viewMode.value = saved
  } catch { /* private mode */ }
  void load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          {{ t('plants.title') }}
        </h1>
        <p class="text-sm text-muted">
          {{ t('plants.subtitle') }}
        </p>
      </div>
      <UButton
        v-if="listTab === 'active'"
        to="/plants/new"
        icon="i-lucide-plus"
        size="sm"
      >
        {{ t('common.new') }}
      </UButton>
    </div>

    <UTabs
      v-model="listTab"
      :items="tabItems"
      class="w-full"
    />

    <div class="flex items-center gap-2">
      <USelect
        v-if="showHealthFilter"
        v-model="filter"
        :items="filterItems"
        class="min-w-0 flex-1"
        :aria-label="t('plants.filterAria')"
      />
      <div
        class="ml-auto flex shrink-0 rounded-full bg-elevated p-0.5 ring-1 ring-inset ring-default"
        role="group"
        :aria-label="t('plants.viewModeAria')"
      >
        <UButton
          icon="i-lucide-layout-grid"
          size="sm"
          :color="viewMode === 'grid' ? 'primary' : 'neutral'"
          :variant="viewMode === 'grid' ? 'soft' : 'ghost'"
          class="rounded-full"
          :aria-label="t('plants.viewGrid')"
          :aria-pressed="viewMode === 'grid'"
          @click="viewMode = 'grid'"
        />
        <UButton
          icon="i-lucide-list"
          size="sm"
          :color="viewMode === 'list' ? 'primary' : 'neutral'"
          :variant="viewMode === 'list' ? 'soft' : 'ghost'"
          class="rounded-full"
          :aria-label="t('plants.viewList')"
          :aria-pressed="viewMode === 'list'"
          @click="viewMode = 'list'"
        />
      </div>
    </div>

    <div
      v-if="loading"
      :class="viewMode === 'grid' ? 'grid grid-cols-2 gap-3 md:grid-cols-3' : 'space-y-2'"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        :class="viewMode === 'grid' ? 'aspect-[4/5] rounded-2xl' : 'h-[74px] rounded-2xl'"
      />
    </div>

    <AppLoadError
      v-else-if="loadError"
      :description="loadError"
      @retry="load"
    />

    <UAlert
      v-else-if="!plants.length"
      :title="listTab === 'archived' ? t('plants.emptyArchivedTitle') : t('plants.emptyTitle')"
      :description="listTab === 'archived' ? t('plants.emptyArchivedDescription') : t('plants.emptyDescription')"
      icon="i-lucide-leaf"
    >
      <template
        v-if="listTab === 'active'"
        #actions
      >
        <UButton
          to="/plants/new"
          size="sm"
          icon="i-lucide-plus"
        >
          {{ t('home.addPlant') }}
        </UButton>
      </template>
    </UAlert>

    <ul
      v-else
      :class="viewMode === 'grid' ? 'grid grid-cols-2 gap-3 md:grid-cols-3' : 'space-y-2'"
    >
      <li
        v-for="plant in plants"
        :key="plant.id"
      >
        <PlantsPlantCard
          :plant="plant"
          :photo-src="photoFor(plant.photo_path)"
          :archived="listTab === 'archived'"
          :next-water-at="nextWaterByPlant.get(plant.id)"
          :variant="viewMode"
        />
      </li>
    </ul>
  </div>
</template>
