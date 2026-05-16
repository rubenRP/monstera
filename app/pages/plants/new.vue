<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const route = useRoute()
const defaultSiteId = (route.query.siteId as string) || null

const { createPlant } = usePlants()
const loading = ref(false)
const toast = useToast()

const initialPlant = defaultSiteId
  ? ({ site_id: defaultSiteId } as Plant)
  : null

async function onSubmit(data: PlantFormInput, photo?: File) {
  loading.value = true
  try {
    const plant = await createPlant(data, photo)
    toast.add({ title: t('plants.created'), color: 'success' })
    await navigateTo(`/plants/${plant.id}`)
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e) || t('plants.saveFailed'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      {{ t('plants.newTitle') }}
    </h1>
    <PlantsPlantForm
      :initial="initialPlant"
      :loading="loading"
      @submit="onSubmit"
    />
  </div>
</template>
