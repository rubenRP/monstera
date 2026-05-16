<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'

const { t } = useI18n()
const { healthOptions } = usePlantEnumLabels()
const { fetchPlants } = usePlants()
const plants = ref<Awaited<ReturnType<typeof fetchPlants>>>([])
const photoUrls = ref<Record<string, string>>({})
const loading = ref(true)
const filter = ref<HealthStatus | 'all'>('all')

const filterItems = computed(() => [
  { label: t('plants.filterAll'), value: 'all' },
  ...healthOptions.value.map(o => ({ label: o.label, value: o.value }))
])

async function load() {
  loading.value = true
  try {
    plants.value = await fetchPlants(filter.value === 'all' ? undefined : filter.value)
    const { getSignedPhotoUrl } = usePlants()
    const urls: Record<string, string> = {}
    await Promise.all(
      plants.value.map(async (p) => {
        if (p.photo_path) {
          try {
            urls[p.id] = await getSignedPhotoUrl(p.photo_path)
          } catch { /* ignore */ }
        }
      })
    )
    photoUrls.value = urls
  } finally {
    loading.value = false
  }
}

watch(filter, load)
onMounted(load)
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
        to="/plants/new"
        icon="i-lucide-plus"
        size="sm"
      >
        {{ t('common.new') }}
      </UButton>
    </div>

    <USelect
      v-model="filter"
      :items="filterItems"
      class="w-full"
    />

    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 4"
        :key="i"
        class="h-16"
      />
    </div>

    <UAlert
      v-else-if="!plants.length"
      :title="t('plants.emptyTitle')"
      :description="t('plants.emptyDescription')"
      icon="i-lucide-leaf"
    />

    <ul
      v-else
      class="space-y-2"
    >
      <li
        v-for="plant in plants"
        :key="plant.id"
      >
        <PlantsPlantCard
          :plant="plant"
          :photo-src="photoUrls[plant.id]"
        />
      </li>
    </ul>
  </div>
</template>
