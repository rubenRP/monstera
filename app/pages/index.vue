<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'

const { fetchTodayTasks, completeTask, skipTask, taskLabel, taskIcon } = useCareTasks()
const { fetchPlants } = usePlants()

const tasks = ref<Awaited<ReturnType<typeof fetchTodayTasks>>>([])
const plants = ref<Awaited<ReturnType<typeof fetchPlants>>>([])
const loading = ref(true)
const acting = ref<string | null>(null)

const healthSummary = computed(() => {
  const counts: Record<HealthStatus, number> = {
    healthy: 0,
    fair: 0,
    sick: 0,
    critical: 0
  }
  for (const p of plants.value) {
    counts[p.health_status]++
  }
  return counts
})

onMounted(async () => {
  try {
    ;[tasks.value, plants.value] = await Promise.all([fetchTodayTasks(), fetchPlants()])
  } finally {
    loading.value = false
  }
})

async function markDone(taskId: string) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return
  acting.value = taskId
  try {
    await completeTask(task)
    tasks.value = await fetchTodayTasks()
  } finally {
    acting.value = null
  }
}

async function markSkip(taskId: string) {
  acting.value = taskId
  try {
    await skipTask(taskId)
    tasks.value = await fetchTodayTasks()
  } finally {
    acting.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Hoy</h1>
      <p class="text-muted text-sm">{{ new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
    </div>

    <UCard v-if="!loading && (healthSummary.sick > 0 || healthSummary.critical > 0 || healthSummary.fair > 0)">
      <template #header>
        <span class="font-medium">Resumen de plantas</span>
      </template>
      <div class="flex flex-wrap gap-2 text-sm">
        <UBadge v-if="healthSummary.critical > 0" color="error">
          {{ healthSummary.critical }} muy enferma{{ healthSummary.critical > 1 ? 's' : '' }}
        </UBadge>
        <UBadge v-if="healthSummary.sick > 0" color="warning">
          {{ healthSummary.sick }} enferma{{ healthSummary.sick > 1 ? 's' : '' }}
        </UBadge>
        <UBadge v-if="healthSummary.fair > 0" color="warning" variant="subtle">
          {{ healthSummary.fair }} regular{{ healthSummary.fair > 1 ? 'es' : '' }}
        </UBadge>
        <UBadge v-if="healthSummary.healthy > 0" color="success" variant="subtle">
          {{ healthSummary.healthy }} bien
        </UBadge>
      </div>
    </UCard>

    <div v-if="loading" class="space-y-3">
      <USkeleton v-for="i in 3" :key="i" class="h-16" />
    </div>

    <UAlert
      v-else-if="!tasks.length"
      color="neutral"
      icon="i-lucide-check-circle"
      title="¡Todo al día!"
      description="No hay tareas de riego o fertilización pendientes para hoy."
    />

    <ul v-else class="space-y-3">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="p-4 rounded-xl border border-default bg-elevated/30"
      >
        <div class="flex items-start gap-3">
          <UIcon :name="taskIcon(task.type)" class="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/plants/${task.plant_id}`" class="font-medium hover:text-primary">
              {{ task.plant?.name }}
            </NuxtLink>
            <p class="text-sm text-muted">
              {{ taskLabel(task.type) }}
              <span v-if="task.plant?.site?.name"> · {{ task.plant.site.name }}</span>
            </p>
          </div>
          <div class="flex gap-1 shrink-0">
            <UButton
              size="xs"
              color="primary"
              :loading="acting === task.id"
              @click="markDone(task.id)"
            >
              Hecho
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              @click="markSkip(task.id)"
            >
              Omitir
            </UButton>
          </div>
        </div>
      </li>
    </ul>

    <UButton to="/plants/new" block icon="i-lucide-plus" variant="soft">
      Añadir planta
    </UButton>
  </div>
</template>
