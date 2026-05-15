<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'
import { getHealthLabel } from '#shared/constants/plants'

const route = useRoute()
const id = route.params.id as string
const { fetchPlant, updateHealthStatus, deletePlant } = usePlants()
const { fetchTodayTasks, completeTask, taskLabel, taskIcon } = useCareTasks()
const toast = useToast()

const plant = ref<Awaited<ReturnType<typeof fetchPlant>> | null>(null)
const { url: photoUrl } = usePlantPhoto(computed(() => plant.value?.photo_path))
const pendingTasks = ref<Awaited<ReturnType<typeof fetchTodayTasks>>>([])
const loading = ref(true)
const healthStatus = ref<HealthStatus>('healthy')
const healthNote = ref<string | null>(null)

onMounted(async () => {
  try {
    plant.value = await fetchPlant(id)
    healthStatus.value = plant.value.health_status
    healthNote.value = plant.value.health_status_note
    const all = await fetchTodayTasks()
    pendingTasks.value = all.filter(t => t.plant_id === id)
  } finally {
    loading.value = false
  }
})

async function saveHealth() {
  if (!plant.value) return
  try {
    await updateHealthStatus(plant.value.id, healthStatus.value, healthNote.value)
    plant.value.health_status = healthStatus.value
    toast.add({ title: 'Estado actualizado', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: e instanceof Error ? e.message : '', color: 'error' })
  }
}

async function onCompleteTask(taskId: string) {
  const task = pendingTasks.value.find(t => t.id === taskId)
  if (!task) return
  await completeTask(task)
  pendingTasks.value = (await fetchTodayTasks()).filter(t => t.plant_id === id)
  plant.value = await fetchPlant(id)
}

async function onDelete() {
  if (!confirm('¿Eliminar esta planta?')) return
  await deletePlant(id)
  await navigateTo('/plants')
}
</script>

<template>
  <div v-if="loading" class="space-y-4">
    <USkeleton class="h-48 w-full" />
    <USkeleton class="h-8 w-2/3" />
  </div>

  <div v-else-if="plant" class="space-y-6">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h1 class="text-2xl font-bold">{{ plant.name }}</h1>
        <p v-if="plant.species" class="text-muted">{{ plant.species }}</p>
      </div>
      <UDropdownMenu
        :items="[[
          { label: 'Editar', icon: 'i-lucide-pencil', to: `/plants/${id}/edit` },
          { label: 'Eliminar', icon: 'i-lucide-trash', onSelect: onDelete }
        ]]"
      >
        <UButton icon="i-lucide-more-vertical" variant="ghost" color="neutral" />
      </UDropdownMenu>
    </div>

    <img
      v-if="photoUrl"
      :src="photoUrl"
      :alt="plant.name"
      class="w-full h-48 object-cover rounded-xl"
    >

    <UCard>
      <p class="text-sm font-medium mb-2">Estado: {{ getHealthLabel(plant.health_status) }}</p>
      <PlantsHealthSemaphore
        v-model="healthStatus"
        v-model:note="healthNote"
      />
      <UButton class="mt-3" size="sm" @click="saveHealth">
        Guardar estado
      </UButton>
    </UCard>

    <PlantsPlantContextBadges :plant="plant" />

    <div v-if="pendingTasks.length" class="space-y-2">
      <h2 class="font-semibold">Tareas de hoy</h2>
      <div
        v-for="task in pendingTasks"
        :key="task.id"
        class="flex items-center justify-between p-3 rounded-lg border border-default"
      >
        <div class="flex items-center gap-2">
          <UIcon :name="taskIcon(task.type)" class="text-primary" />
          <span>{{ taskLabel(task.type) }}</span>
        </div>
        <UButton size="sm" @click="onCompleteTask(task.id)">
          Hecho
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <UButton :to="`/plants/${id}/diagnose`" block variant="soft" icon="i-lucide-stethoscope">
        Diagnosticar
      </UButton>
      <UButton :to="`/plants/${id}/recommend`" block variant="soft" icon="i-lucide-cloud-sun">
        Recomendaciones
      </UButton>
    </div>

    <p v-if="plant.notes" class="text-sm text-muted whitespace-pre-wrap">{{ plant.notes }}</p>
  </div>
</template>
