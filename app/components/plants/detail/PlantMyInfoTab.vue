<script setup lang="ts">
import type { CareTask, HealthStatus, Plant } from '#shared/types/database'
import type { InfoRow } from './PlantInfoRows.vue'

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const {
  healthLabel,
  potSizeLabel,
  potMaterialLabel,
  substrateLabel
} = usePlantEnumLabels()
const { placementLabel, orientationLabel, luminosityLabel } = useSiteEnumLabels()

const props = defineProps<{
  plant: Plant
  pendingTasks: CareTask[]
  actingTaskId: string | null
}>()

const healthStatus = defineModel<HealthStatus>('healthStatus', { required: true })
const healthNote = defineModel<string>('healthNote', { required: true })

const emit = defineEmits<{
  saveHealth: []
  completeTask: [taskId: string]
  skipTask: [task: CareTask]
}>()

const { taskLabel, taskIcon, overdueDays, overdueLabel, fertilizeWithWater } = useCareTasks()
const { fetchHomeLat, computeScheduleForPlant, countRecentWetSkips } = useAdaptiveWatering()

const wateringSchedule = ref<ReturnType<typeof computeScheduleForPlant> | null>(null)

async function loadWateringSchedule() {
  const homeLat = await fetchHomeLat()
  const wetCount = await countRecentWetSkips(props.plant.id)
  wateringSchedule.value = computeScheduleForPlant(props.plant, homeLat, {
    recentWetSkipCount: wetCount
  })
}

watch(() => props.plant, () => {
  void loadWateringSchedule()
}, { immediate: true, deep: true })

const empty = computed(() => t('common.notIndicated'))

function formatDate(iso: string | null): string {
  if (!iso) return empty.value
  return new Date(iso).toLocaleDateString(dateLocale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function taskDueLabel(dueAt: string): string {
  const overdue = overdueDays(dueAt)
  if (overdue > 0) return overdueLabel(dueAt)
  if (overdue === 0) return t('care.dueToday')
  const days = -overdue
  if (days === 1) return t('care.dueTomorrow')
  return t('care.dueInDays', { days })
}

const lightingRows = computed((): InfoRow[] => {
  const site = props.plant.site
  const rows: InfoRow[] = []
  if (site) {
    rows.push({ label: t('plants.fieldSite'), value: site.name })
    rows.push({ label: t('plants.fieldPlacement'), value: placementLabel(site.placement) })
    rows.push({
      label: t('plants.fieldOrientation'),
      value: site.window_orientation
        ? orientationLabel(site.window_orientation)
        : empty.value
    })
    rows.push({
      label: t('plants.fieldLuminosity'),
      value: site.luminosity ? luminosityLabel(site.luminosity) : empty.value
    })
    rows.push({
      label: t('plants.fieldCeiling'),
      value: site.has_ceiling_cover ? t('common.yes') : t('common.no')
    })
  } else {
    rows.push({ label: t('plants.fieldSite'), value: empty.value })
  }
  rows.push({
    label: t('plants.fieldWindowDistance'),
    value: props.plant.window_distance_cm != null
      ? `${props.plant.window_distance_cm} ${t('common.cm')}`
      : empty.value
  })
  return rows
})

const potRows = computed((): InfoRow[] => [
  {
    label: t('plants.fieldSize'),
    value: props.plant.pot_size ? potSizeLabel(props.plant.pot_size) : empty.value
  },
  {
    label: t('plants.fieldDiameter'),
    value: props.plant.pot_diameter_cm != null
      ? `${props.plant.pot_diameter_cm} ${t('common.cm')}`
      : empty.value
  },
  {
    label: t('plants.fieldMaterial'),
    value: props.plant.pot_material ? potMaterialLabel(props.plant.pot_material) : empty.value
  },
  {
    label: t('plants.fieldDrainage'),
    value: props.plant.has_drainage ? t('plants.drainageYes') : t('plants.drainageNo')
  },
  {
    label: t('plants.fieldSubstrate'),
    value: props.plant.substrate_type ? substrateLabel(props.plant.substrate_type) : empty.value
  },
  {
    label: t('plants.fieldSubstrateNotes'),
    value: props.plant.substrate_notes?.trim() || empty.value
  }
])

const plantRows = computed((): InfoRow[] => [
  {
    label: t('plants.species'),
    value: props.plant.species?.trim() || empty.value
  },
  {
    label: t('plants.fieldHeight'),
    value: props.plant.height_cm != null
      ? `${props.plant.height_cm} ${t('common.cm')}${props.plant.height_updated_at ? t('plants.heightUpdated', { date: formatDate(props.plant.height_updated_at) }) : ''}`
      : empty.value
  },
  {
    label: t('plants.fieldAge'),
    value: props.plant.age_years != null
      ? t('plants.ageValue', { count: props.plant.age_years })
      : empty.value
  },
  {
    label: t('plants.fieldWaterBase'),
    value: t('plants.intervalDays', {
      count: props.plant.watering_base_interval_days ?? props.plant.watering_interval_days
    })
  },
  {
    label: t('plants.fieldWaterEffective'),
    value: t('plants.intervalDays', { count: props.plant.watering_interval_days })
  },
  {
    label: t('plants.fieldFertilizeEvery'),
    value: t('plants.intervalDays', { count: props.plant.fertilizing_interval_days })
  },
  {
    label: t('plants.fieldLastWater'),
    value: formatDate(props.plant.last_watered_at)
  },
  {
    label: t('plants.fieldLastFertilize'),
    value: formatDate(props.plant.last_fertilized_at)
  }
])
</script>

<template>
  <div class="space-y-4">
    <PlantsDetailPlantInfoSection
      :title="t('plants.lighting')"
      icon="i-lucide-sun"
    >
      <p
        v-if="plant.site_id && plant.site"
        class="text-xs text-muted mb-3"
      >
        <NuxtLink
          :to="`/sites/${plant.site_id}`"
          class="text-primary underline"
        >
          {{ t('plants.viewSite', { name: plant.site.name }) }}
        </NuxtLink>
      </p>
      <PlantsDetailPlantInfoRows :rows="lightingRows" />
    </PlantsDetailPlantInfoSection>

    <PlantsDetailPlantInfoSection
      :title="t('plants.pot')"
      icon="i-lucide-flower-2"
    >
      <PlantsDetailPlantInfoRows :rows="potRows" />
    </PlantsDetailPlantInfoSection>

    <PlantsDetailPlantInfoSection
      :title="t('plants.plantSection')"
      icon="i-lucide-leaf"
    >
      <PlantsDetailPlantInfoRows :rows="plantRows" />
      <div class="mt-4 pt-4 border-t border-default">
        <p class="text-sm font-medium mb-2">
          {{ t('plants.statusLabel', { status: healthLabel(plant.health_status) }) }}
        </p>
        <PlantsHealthSemaphore
          v-model="healthStatus"
          v-model:note="healthNote"
        />
        <UButton
          class="mt-3"
          size="sm"
          @click="emit('saveHealth')"
        >
          {{ t('plants.saveHealth') }}
        </UButton>
      </div>
    </PlantsDetailPlantInfoSection>

    <PlantsDetailWateringScheduleCard
      v-if="wateringSchedule"
      :plant="plant"
      :factors="wateringSchedule.factors"
      :effective-days="wateringSchedule.effectiveIntervalDays"
    />

    <UCard v-if="plant.notes?.trim()">
      <template #header>
        <span class="font-medium">{{ t('plants.notes') }}</span>
      </template>
      <p class="text-sm text-muted whitespace-pre-wrap">
        {{ plant.notes }}
      </p>
    </UCard>

    <div
      v-if="pendingTasks.length"
      class="space-y-2"
    >
      <h2 class="font-semibold text-sm">
        {{ t('care.pendingTasks') }}
      </h2>
      <div
        v-for="task in pendingTasks"
        :key="task.id"
        class="flex items-center justify-between p-3 rounded-lg border border-default"
        :class="overdueDays(task.due_at) > 0 ? 'border-warning/50' : ''"
      >
        <div class="flex items-center gap-2 min-w-0">
          <UIcon
            :name="taskIcon(task.type)"
            class="shrink-0"
            :class="overdueDays(task.due_at) > 0 ? 'text-warning' : 'text-primary'"
          />
          <div class="min-w-0">
            <p class="text-sm font-medium">
              {{ taskLabel(task.type) }}
              <span
                v-if="fertilizeWithWater(task, pendingTasks)"
                class="font-normal text-muted"
              > · {{ t('care.fertilizeWithWater') }}</span>
            </p>
            <p
              class="text-xs"
              :class="overdueDays(task.due_at) > 0 ? 'text-warning' : 'text-muted'"
            >
              {{ taskDueLabel(task.due_at) }}
            </p>
          </div>
        </div>
        <div class="flex gap-1 shrink-0">
          <UButton
            size="sm"
            :loading="actingTaskId === task.id"
            @click="emit('completeTask', task.id)"
          >
            {{ t('common.done') }}
          </UButton>
          <UButton
            v-if="task.type === 'water'"
            size="sm"
            variant="soft"
            color="neutral"
            :disabled="actingTaskId === task.id"
            @click="emit('skipTask', task)"
          >
            {{ t('common.skip') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
