<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'
import { filterPlants, groupPlantsBySite, sortPlants, type PlantSortMode } from '#shared/utils/plants/listView'

const { t } = useI18n()
usePageTitle(() => t('plants.title'))
const { healthOptions } = usePlantEnumLabels()
const { fetchPlants } = usePlants()
const { fetchPendingDueByPlant } = useCareTasks()
const { urlFor: photoFor, ensure: ensurePhotoUrls } = usePlantPhotoUrls()
const plants = ref<Awaited<ReturnType<typeof fetchPlants>>>([])
const nextWaterByPlant = ref<Map<string, string>>(new Map())
const VIEW_STORAGE_KEY = 'monstera_plants_view'
const PREFS_STORAGE_KEY = 'monstera_plants_prefs'
const viewMode = ref<'grid' | 'list'>('grid')
const search = ref('')
const sortMode = ref<PlantSortMode>('next_water')
const groupBySite = ref(false)
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

const sortItems = computed(() => [
  { label: t('plants.sortNextWater'), value: 'next_water' },
  { label: t('plants.sortName'), value: 'name' },
  { label: t('plants.sortHealth'), value: 'health' }
])

const visiblePlants = computed(() =>
  sortPlants(filterPlants(plants.value, search.value), sortMode.value, nextWaterByPlant.value)
)

const groups = computed(() =>
  groupBySite.value
    ? groupPlantsBySite(visiblePlants.value)
    : [{ siteId: 'all', siteName: null, plants: visiblePlants.value }]
)

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
watch([sortMode, groupBySite], () => {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ sort: sortMode.value, group: groupBySite.value }))
  } catch { /* private mode */ }
})
onMounted(() => {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    if (saved === 'list' || saved === 'grid') viewMode.value = saved
    const prefs = JSON.parse(localStorage.getItem(PREFS_STORAGE_KEY) ?? '{}') as { sort?: string, group?: boolean }
    if (prefs.sort === 'next_water' || prefs.sort === 'name' || prefs.sort === 'health') sortMode.value = prefs.sort
    if (typeof prefs.group === 'boolean') groupBySite.value = prefs.group
  } catch { /* private mode or bad JSON */ }
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
      <UInput
        v-model="search"
        icon="i-lucide-search"
        type="search"
        class="min-w-0 flex-1"
        :placeholder="t('plants.searchPlaceholder')"
        :aria-label="t('plants.searchPlaceholder')"
      />
      <div
        class="flex shrink-0 rounded-full bg-elevated p-0.5 ring-1 ring-inset ring-default"
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

    <div class="flex items-center gap-2">
      <USelect
        v-if="showHealthFilter"
        v-model="filter"
        :items="filterItems"
        class="min-w-0 flex-1"
        :aria-label="t('plants.filterAria')"
      />
      <USelect
        v-model="sortMode"
        :items="sortItems"
        icon="i-lucide-arrow-up-down"
        class="min-w-0 flex-1"
        :aria-label="t('plants.sortAria')"
      />
      <UButton
        icon="i-lucide-map-pin"
        :color="groupBySite ? 'primary' : 'neutral'"
        :variant="groupBySite ? 'soft' : 'outline'"
        :aria-label="t('plants.groupBySite')"
        :aria-pressed="groupBySite"
        @click="groupBySite = !groupBySite"
      />
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

    <AppEmptyState
      v-else-if="plants.length && !visiblePlants.length"
      :title="t('plants.noSearchResults')"
      :description="t('plants.noSearchResultsHint', { query: search })"
    >
      <UButton
        variant="soft"
        icon="i-lucide-x"
        @click="search = ''"
      >
        {{ t('plants.clearSearch') }}
      </UButton>
    </AppEmptyState>

    <AppEmptyState
      v-else-if="!plants.length"
      :title="listTab === 'archived' ? t('plants.emptyArchivedTitle') : t('plants.emptyTitle')"
      :description="listTab === 'archived' ? t('plants.emptyArchivedDescription') : t('plants.emptyDescription')"
    >
      <UButton
        v-if="listTab === 'active'"
        to="/plants/new"
        icon="i-lucide-plus"
      >
        {{ t('home.addPlant') }}
      </UButton>
    </AppEmptyState>

    <div
      v-else
      class="space-y-6"
    >
      <section
        v-for="group in groups"
        :key="group.siteId ?? 'none'"
      >
        <h2
          v-if="groupBySite"
          class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-highlighted"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-4 text-primary"
          />
          {{ group.siteName ?? t('plants.noSiteGroup') }}
          <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">{{ group.plants.length }}</span>
        </h2>
        <ul :class="viewMode === 'grid' ? 'grid grid-cols-2 gap-3 md:grid-cols-3' : 'space-y-2'">
          <li
            v-for="plant in group.plants"
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
      </section>
    </div>
  </div>
</template>
