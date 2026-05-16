<script setup lang="ts">
import { getHealthColor } from '#shared/constants/plants'

const { t } = useI18n()
const route = useRoute()
const id = route.params.id as string
const { fetchSite, deleteSite } = useSites()
const { placementLabel, orientationLabel, luminosityLabel } = useSiteEnumLabels()
const { healthLabel } = usePlantEnumLabels()

const site = ref<Awaited<ReturnType<typeof fetchSite>> | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    site.value = await fetchSite(id)
  } finally {
    loading.value = false
  }
})

async function onDelete() {
  if (!confirm(t('sites.deleteConfirm'))) return
  await deleteSite(id)
  await navigateTo('/sites')
}
</script>

<template>
  <div
    v-if="loading"
    class="space-y-4"
  >
    <USkeleton class="h-32" />
  </div>

  <div
    v-else-if="site"
    class="space-y-6"
  >
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UIcon
            name="i-lucide-map-pin"
            class="text-primary"
          />
          {{ site.name }}
        </h1>
        <p class="text-muted text-sm mt-1">
          {{ placementLabel(site.placement) }}
          <span v-if="site.window_orientation"> · {{ orientationLabel(site.window_orientation) }}</span>
        </p>
      </div>
      <UDropdownMenu
        :items="[[
          { label: t('common.edit'), icon: 'i-lucide-pencil', to: `/sites/${id}/edit` },
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

    <UCard>
      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div v-if="site.luminosity">
          <dt class="text-muted">
            {{ t('sites.luminosityLabel') }}
          </dt>
          <dd class="font-medium">
            {{ luminosityLabel(site.luminosity) }}
          </dd>
        </div>
        <div v-if="site.has_ceiling_cover">
          <dt class="text-muted">
            {{ t('sites.coverLabel') }}
          </dt>
          <dd class="font-medium">
            {{ t('sites.coverValue') }}
          </dd>
        </div>
      </dl>
      <p
        v-if="site.notes"
        class="text-sm text-muted mt-3 whitespace-pre-wrap"
      >
        {{ site.notes }}
      </p>
    </UCard>

    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold">
          {{ t('sites.plantsInSite') }}
        </h2>
        <UButton
          :to="`/plants/new?siteId=${id}`"
          size="sm"
          variant="soft"
          icon="i-lucide-plus"
        >
          {{ t('sites.addPlant') }}
        </UButton>
      </div>

      <UAlert
        v-if="!site.plants?.length"
        color="neutral"
        :title="t('sites.noPlants')"
      />

      <ul
        v-else
        class="space-y-2"
      >
        <li
          v-for="plant in site.plants"
          :key="plant.id"
        >
          <NuxtLink
            :to="`/plants/${plant.id}`"
            class="flex items-center gap-3 p-3 rounded-lg border border-default hover:bg-elevated/50"
          >
            <span
              class="w-2 h-8 rounded-full"
              :class="getHealthColor(plant.health_status)"
            />
            <span class="font-medium">{{ plant.name }}</span>
            <span class="text-xs text-muted ml-auto">{{ healthLabel(plant.health_status) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>
