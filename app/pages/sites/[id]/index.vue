<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import { HEALTH_DOT_CLASSES } from '#shared/constants/plants'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const route = useRoute()
const id = route.params.id as string
const { fetchSite, deleteSite } = useSites()
const { movePlantToSite } = usePlants()
const { placementLabel, orientationLabel, luminosityLabel } = useSiteEnumLabels()
const { healthLabel } = usePlantEnumLabels()
const toast = useToast()

const site = ref<Awaited<ReturnType<typeof fetchSite>> | null>(null)
const loading = ref(true)
const moveSiteModalOpen = ref(false)
const moveSiteLoading = ref(false)
const plantToMove = ref<Pick<Plant, 'id' | 'name' | 'site_id'> | null>(null)

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

function openMoveModal(plant: NonNullable<NonNullable<typeof site.value>['plants']>[number]) {
  plantToMove.value = { id: plant.id, name: plant.name, site_id: id }
  moveSiteModalOpen.value = true
}

async function onMoveSiteConfirm(siteId: string | null) {
  if (!plantToMove.value) return
  moveSiteLoading.value = true
  try {
    const updated = await movePlantToSite(plantToMove.value.id, siteId)
    site.value = await fetchSite(id)
    moveSiteModalOpen.value = false
    plantToMove.value = null
    const siteName = updated.site?.name
    toast.add({
      title: siteName
        ? t('plants.moveSiteSuccess', { site: siteName })
        : t('plants.moveSiteSuccessNoSite'),
      color: 'success'
    })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    moveSiteLoading.value = false
  }
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
          class="flex items-center gap-2 p-3 rounded-lg border border-default"
        >
          <NuxtLink
            :to="`/plants/${plant.id}`"
            class="flex flex-1 items-center gap-3 min-w-0 hover:opacity-80"
          >
            <span
              class="w-2 h-8 rounded-full shrink-0"
              :class="HEALTH_DOT_CLASSES[plant.health_status]"
            />
            <span class="font-medium truncate">{{ plant.name }}</span>
            <span class="text-xs text-muted ml-auto shrink-0">{{ healthLabel(plant.health_status) }}</span>
          </NuxtLink>
          <UButton
            icon="i-lucide-map-pin"
            variant="ghost"
            color="neutral"
            size="sm"
            :aria-label="t('plants.moveSite')"
            @click="openMoveModal(plant)"
          />
        </li>
      </ul>
    </div>

    <PlantsPlantMoveSiteModal
      v-if="plantToMove"
      v-model:open="moveSiteModalOpen"
      :plant="plantToMove"
      :loading="moveSiteLoading"
      @confirm="onMoveSiteConfirm"
    />
  </div>
</template>
