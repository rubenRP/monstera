<script setup lang="ts">
import type { CareTask, HealthStatus, Plant } from '#shared/types/database'
import {
  getHealthLabel,
  POT_MATERIAL_OPTIONS,
  POT_SIZE_OPTIONS,
  SUBSTRATE_OPTIONS
} from '#shared/constants/plants'
import {
  getLuminosityLabel,
  getOrientationLabel,
  getPlacementLabel
} from '#shared/constants/sites'
import type { InfoRow } from './PlantInfoRows.vue'

const props = defineProps<{
  plant: Plant
  pendingTasks: CareTask[]
  actingTaskId: string | null
}>()

const healthStatus = defineModel<HealthStatus>('healthStatus', { required: true })
const healthNote = defineModel<string | null>('healthNote', { required: true })

const emit = defineEmits<{
  saveHealth: []
  completeTask: [taskId: string]
}>()

const { taskLabel, taskIcon } = useCareTasks()

const EMPTY = 'No indicado'

function formatDate(iso: string | null): string {
  if (!iso) return EMPTY
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const lightingRows = computed((): InfoRow[] => {
  const site = props.plant.site
  const rows: InfoRow[] = []
  if (site) {
    rows.push({
      label: 'Sitio',
      value: site.name
    })
    rows.push({
      label: 'Ubicación',
      value: getPlacementLabel(site.placement)
    })
    rows.push({
      label: 'Orientación ventana',
      value: site.window_orientation
        ? getOrientationLabel(site.window_orientation)
        : EMPTY
    })
    rows.push({
      label: 'Luminosidad',
      value: site.luminosity ? getLuminosityLabel(site.luminosity) : EMPTY
    })
    rows.push({
      label: 'Techo / cubierta',
      value: site.has_ceiling_cover ? 'Sí' : 'No'
    })
  } else {
    rows.push({ label: 'Sitio', value: EMPTY })
  }
  rows.push({
    label: 'Distancia a ventana',
    value: props.plant.window_distance_cm != null
      ? `${props.plant.window_distance_cm} cm`
      : EMPTY
  })
  return rows
})

const potRows = computed((): InfoRow[] => {
  const pot = POT_SIZE_OPTIONS.find(p => p.value === props.plant.pot_size)
  const material = POT_MATERIAL_OPTIONS.find(m => m.value === props.plant.pot_material)
  const sub = SUBSTRATE_OPTIONS.find(s => s.value === props.plant.substrate_type)
  return [
    {
      label: 'Tamaño',
      value: pot?.label ?? EMPTY
    },
    {
      label: 'Diámetro',
      value: props.plant.pot_diameter_cm != null
        ? `${props.plant.pot_diameter_cm} cm`
        : EMPTY
    },
    {
      label: 'Material',
      value: material?.label ?? EMPTY
    },
    {
      label: 'Drenaje',
      value: props.plant.has_drainage ? 'Con agujeros' : 'Sin drenaje'
    },
    {
      label: 'Sustrato',
      value: sub?.label ?? EMPTY
    },
    {
      label: 'Notas sustrato',
      value: props.plant.substrate_notes?.trim() || EMPTY
    }
  ]
})

const plantRows = computed((): InfoRow[] => [
  {
    label: 'Especie',
    value: props.plant.species?.trim() || EMPTY
  },
  {
    label: 'Altura',
    value: props.plant.height_cm != null
      ? `${props.plant.height_cm} cm${props.plant.height_updated_at ? ` (actualizado ${formatDate(props.plant.height_updated_at)})` : ''}`
      : EMPTY
  },
  {
    label: 'Antigüedad',
    value: props.plant.age_years != null
      ? `${props.plant.age_years} año${props.plant.age_years > 1 ? 's' : ''}`
      : EMPTY
  },
  {
    label: 'Riego cada',
    value: `${props.plant.watering_interval_days} días`
  },
  {
    label: 'Fertilizar cada',
    value: `${props.plant.fertilizing_interval_days} días`
  },
  {
    label: 'Último riego',
    value: formatDate(props.plant.last_watered_at)
  },
  {
    label: 'Última fertilización',
    value: formatDate(props.plant.last_fertilized_at)
  }
])
</script>

<template>
  <div class="space-y-4">
    <PlantsDetailPlantInfoSection title="Iluminación" icon="i-lucide-sun">
      <p v-if="plant.site_id && plant.site" class="text-xs text-muted mb-3">
        <NuxtLink :to="`/sites/${plant.site_id}`" class="text-primary underline">
          Ver sitio «{{ plant.site.name }}»
        </NuxtLink>
      </p>
      <PlantsDetailPlantInfoRows :rows="lightingRows" />
    </PlantsDetailPlantInfoSection>

    <PlantsDetailPlantInfoSection title="Maceta" icon="i-lucide-flower-2">
      <PlantsDetailPlantInfoRows :rows="potRows" />
    </PlantsDetailPlantInfoSection>

    <PlantsDetailPlantInfoSection title="Planta" icon="i-lucide-leaf">
      <PlantsDetailPlantInfoRows :rows="plantRows" />
      <div class="mt-4 pt-4 border-t border-default">
        <p class="text-sm font-medium mb-2">
          Estado: {{ getHealthLabel(plant.health_status) }}
        </p>
        <PlantsHealthSemaphore
          v-model="healthStatus"
          v-model:note="healthNote"
        />
        <UButton class="mt-3" size="sm" @click="emit('saveHealth')">
          Guardar estado
        </UButton>
      </div>
    </PlantsDetailPlantInfoSection>

    <UCard v-if="plant.notes?.trim()">
      <template #header>
        <span class="font-medium">Notas</span>
      </template>
      <p class="text-sm text-muted whitespace-pre-wrap">{{ plant.notes }}</p>
    </UCard>

    <div v-if="pendingTasks.length" class="space-y-2">
      <h2 class="font-semibold text-sm">Tareas de hoy</h2>
      <div
        v-for="task in pendingTasks"
        :key="task.id"
        class="flex items-center justify-between p-3 rounded-lg border border-default"
      >
        <div class="flex items-center gap-2">
          <UIcon :name="taskIcon(task.type)" class="text-primary" />
          <span class="text-sm">{{ taskLabel(task.type) }}</span>
        </div>
        <UButton
          size="sm"
          :loading="actingTaskId === task.id"
          @click="emit('completeTask', task.id)"
        >
          Hecho
        </UButton>
      </div>
    </div>
  </div>
</template>
