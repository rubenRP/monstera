<script setup lang="ts">
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const route = useRoute()
const id = route.params.id as string
const { fetchPlant, updatePlant } = usePlants()
const plant = ref<Awaited<ReturnType<typeof fetchPlant>> | null>(null)
const loading = ref(true)
const saving = ref(false)
const toast = useToast()

onMounted(async () => {
  plant.value = await fetchPlant(id)
  loading.value = false
})

async function onSubmit(data: PlantFormInput, photo?: File) {
  saving.value = true
  try {
    await updatePlant(id, data, photo)
    toast.add({ title: 'Planta actualizada', color: 'success' })
    await navigateTo(`/plants/${id}`)
  } catch (e: unknown) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : '',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Editar planta</h1>
    <USkeleton v-if="loading" class="h-64" />
    <PlantsPlantForm
      v-else-if="plant"
      :initial="plant"
      :loading="saving"
      @submit="onSubmit"
    />
  </div>
</template>
