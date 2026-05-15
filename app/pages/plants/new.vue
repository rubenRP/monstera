<script setup lang="ts">
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const route = useRoute()
const defaultSiteId = (route.query.siteId as string) || null

const { createPlant } = usePlants()
const loading = ref(false)
const toast = useToast()

const initialPlant = defaultSiteId
  ? { site_id: defaultSiteId } as { site_id: string }
  : null

async function onSubmit(data: PlantFormInput, photo?: File) {
  loading.value = true
  try {
    const plant = await createPlant(data, photo)
    toast.add({ title: 'Planta creada', color: 'success' })
    await navigateTo(`/plants/${plant.id}`)
  } catch (e: unknown) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'No se pudo guardar',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Nueva planta</h1>
    <PlantsPlantForm :initial="initialPlant" :loading="loading" @submit="onSubmit" />
  </div>
</template>
