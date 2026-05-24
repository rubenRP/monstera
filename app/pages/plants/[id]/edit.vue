<script setup lang="ts">
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const route = useRoute()
const id = route.params.id as string
const { fetchPlant, updatePlant } = usePlants()
const plant = ref<Awaited<ReturnType<typeof fetchPlant>> | null>(null)
const loading = ref(true)
const saving = ref(false)
const toast = useToast()

onMounted(async () => {
  plant.value = await fetchPlant(id)
  if (plant.value.archived_at) {
    toast.add({ title: t('plants.archivedReadOnly'), color: 'warning' })
    await navigateTo(`/plants/${id}`)
    return
  }
  loading.value = false
})

async function onSubmit(data: PlantFormInput, photo?: File) {
  saving.value = true
  try {
    await updatePlant(id, data, photo)
    toast.add({ title: t('plants.updated'), color: 'success' })
    await navigateTo(`/plants/${id}`)
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      {{ t('plants.editTitle') }}
    </h1>
    <USkeleton
      v-if="loading"
      class="h-64"
    />
    <PlantsPlantForm
      v-else-if="plant"
      :initial="plant"
      :loading="saving"
      @submit="onSubmit"
    />
  </div>
</template>
