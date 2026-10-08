<script setup lang="ts">
import type { CareTask, HealthStatus, Plant } from '#shared/types/database'
import type { SpeciesProfile } from '#shared/types/species'
import type { WateringScheduleResult } from '#shared/utils/care/adaptiveWatering'
import {
  evaluateGrowthConditions,
  growthConditionsEditTarget
} from '#shared/utils/plants/growthConditions'
import { HEALTH_ICONS, HEALTH_ICON_CLASSES } from '#shared/constants/plants'
import { countPlantCompleteness } from '#shared/utils/plants/plantCompleteness'

const { t } = useI18n()
const { healthLabel } = usePlantEnumLabels()

const props = defineProps<{
  plant: Plant
  pendingTasks: CareTask[]
  actingTaskId: string | null
  readOnly?: boolean
}>()

const healthStatus = defineModel<HealthStatus>('healthStatus', { required: true })
const healthNote = defineModel<string>('healthNote', { required: true })

const emit = defineEmits<{
  saveHealth: []
  completeTask: [taskId: string]
  skipTask: [task: CareTask]
}>()

const { taskLabel, taskIcon, overdueDays, overdueLabel, fertilizeWithWater } = useCareTasks()
const { fetchHomeLat, computeScheduleForPlant, countRecentWetSkips, fetchWateringHistoryIntervals, resolveWateringReference } = useAdaptiveWatering()
const { snapshot: weatherSnapshot, load: loadWeather } = usePlantHomeWeather()
const { fetchSpeciesProfile } = useSpeciesProfile()

const wateringSchedule = ref<WateringScheduleResult | null>(null)
const speciesProfile = ref<SpeciesProfile | null>(null)

const editBase = computed(() => `/plants/${props.plant.id}/edit`)

const completeness = computed(() => countPlantCompleteness(props.plant))

const growthConditions = computed(() => evaluateGrowthConditions({
  siteId: props.plant.site_id,
  site: props.plant.site,
  windowDistanceCm: props.plant.window_distance_cm,
  homeHumidityPercent: weatherSnapshot.value?.homeHumidityPercent ?? null,
  speciesProfile: speciesProfile.value
}))

const growthConditionMessages = computed(() =>
  growthConditions.value.reasons.map(code => t(`plants.growthConditions.${code}`))
)

const growthConditionsEditLink = computed(() =>
  growthConditionsEditTarget(
    growthConditions.value.reasons,
    props.plant.site_id,
    editBase.value
  )
)

async function loadSpeciesProfile() {
  if (!props.plant.species?.trim()) {
    speciesProfile.value = null
    return
  }
  try {
    const res = await fetchSpeciesProfile(props.plant.id)
    speciesProfile.value = res.profile
  } catch {
    speciesProfile.value = null
  }
}

async function loadWateringSchedule() {
  const homeLat = await fetchHomeLat()
  const wetCount = await countRecentWetSkips(props.plant.id)
  const historyIntervals = await fetchWateringHistoryIntervals(props.plant.id)
  const reference = await resolveWateringReference(props.plant.id, false)
  wateringSchedule.value = await computeScheduleForPlant(props.plant, homeLat, {
    recentWetSkipCount: wetCount,
    speciesReferenceDays: reference.referenceDays,
    referenceSource: reference.source,
    completedWaterIntervals: historyIntervals
  })
}

watch(() => props.plant, () => {
  void loadWateringSchedule()
  void loadWeather()
  void loadSpeciesProfile()
}, { immediate: true, deep: true })

function taskDueLabel(dueAt: string): string {
  const overdue = overdueDays(dueAt)
  if (overdue > 0) return overdueLabel(dueAt)
  if (overdue === 0) return t('care.dueToday')
  const days = -overdue
  if (days === 1) return t('care.dueTomorrow')
  return t('care.dueInDays', { days })
}

const plantRef = toRef(props, 'plant')
const {
  lightItems,
  potItems,
  plantItems,
  siteItems,
  climateItems
} = usePlantInfoItems(plantRef, weatherSnapshot)
</script>

<template>
  <div class="space-y-4">
    <UAlert
      v-if="completeness.plantMissingCount > 0"
      color="warning"
      variant="soft"
      :title="t('plants.completenessBanner', { count: completeness.plantMissingCount })"
    />
    <UAlert
      v-if="completeness.missingSite"
      color="info"
      variant="soft"
      :title="t('plants.completenessSite')"
    >
      <template #description>
        <NuxtLink
          :to="`${editBase}#section-light`"
          class="text-primary underline text-sm"
        >
          {{ t('plants.addInSettings') }}
        </NuxtLink>
      </template>
    </UAlert>
    <UAlert
      v-if="weatherSnapshot && !weatherSnapshot.hasLocation"
      color="info"
      variant="soft"
      :title="t('plants.completenessHome')"
    >
      <template #description>
        <NuxtLink
          to="/settings"
          class="text-primary underline text-sm"
        >
          {{ t('plants.configureHomeLocation') }}
        </NuxtLink>
      </template>
    </UAlert>

    <UAlert
      v-if="growthConditions.level === 'warn'"
      color="warning"
      variant="soft"
      :title="t('plants.growthConditionsTitle')"
    >
      <template #description>
        <ul class="list-disc pl-4 text-sm space-y-1">
          <li
            v-for="(msg, i) in growthConditionMessages"
            :key="i"
          >
            {{ msg }}
          </li>
        </ul>
        <NuxtLink
          :to="growthConditionsEditLink"
          class="text-primary underline text-sm mt-2 inline-block"
        >
          {{ t('plants.growthConditionsEdit') }}
        </NuxtLink>
      </template>
    </UAlert>

    <PlantsPlantVarietyReference
      v-if="plant.species?.trim()"
      :species="plant.species"
      :plant-id="plant.id"
    />

    <PlantsDetailPlantInfoGridSection
      :title="t('plants.lighting')"
      :items="lightItems"
    >
      <PlantsPlantContextBadges
        class="mb-2"
        :plant="plant"
        :warning-codes="growthConditions.reasons"
      />
      <p
        v-if="plant.site_id && plant.site"
        class="text-xs text-muted -mt-1"
      >
        <NuxtLink
          :to="`/sites/${plant.site_id}`"
          class="text-primary underline"
        >
          {{ t('plants.viewSite', { name: plant.site.name }) }}
        </NuxtLink>
      </p>
    </PlantsDetailPlantInfoGridSection>

    <PlantsDetailPlantInfoGridSection
      :title="t('plants.pot')"
      :items="potItems"
    />

    <PlantsDetailPlantInfoGridSection
      :title="t('plants.plantSection')"
      :items="plantItems"
    >
      <div class="mt-4 pt-4 border-t border-default space-y-3">
        <div class="flex items-center gap-2.5">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full"
            :class="HEALTH_ICON_CLASSES[plant.health_status]"
          >
            <UIcon
              :name="HEALTH_ICONS[plant.health_status]"
              class="size-4"
            />
          </div>
          <div>
            <p class="text-xs text-muted">
              {{ t('plants.healthStatus') }}
            </p>
            <p class="text-sm font-semibold text-highlighted">
              {{ healthLabel(plant.health_status) }}
            </p>
          </div>
        </div>
        <template v-if="!readOnly">
          <PlantsHealthSemaphore
            v-model="healthStatus"
            v-model:note="healthNote"
          />
          <UButton
            size="sm"
            @click="emit('saveHealth')"
          >
            {{ t('plants.saveHealth') }}
          </UButton>
        </template>
      </div>
    </PlantsDetailPlantInfoGridSection>

    <PlantsDetailPlantInfoGridSection
      :title="t('plants.spaceSite')"
      :items="siteItems"
    >
      <p class="text-xs text-muted -mt-1">
        {{ t('plants.homeComfortHint') }}
        <NuxtLink
          to="/settings"
          class="text-primary underline ml-1"
        >
          {{ t('nav.settings') }}
        </NuxtLink>
      </p>
    </PlantsDetailPlantInfoGridSection>

    <PlantsDetailPlantInfoGridSection
      :title="t('plants.locationClimate')"
      :items="climateItems"
    />

    <PlantsDetailWateringScheduleCard
      v-if="wateringSchedule"
      :plant="plant"
      :factors="wateringSchedule.factors"
      :effective-days="wateringSchedule.effectiveIntervalDays"
      :reference-source="wateringSchedule.referenceSource"
    />

    <PlantsSpeciesPlantSpeciesSectionCard v-if="plant.notes?.trim()">
      <p class="text-sm text-toned whitespace-pre-wrap">
        {{ plant.notes }}
      </p>
    </PlantsSpeciesPlantSpeciesSectionCard>

    <div
      v-if="!readOnly && pendingTasks.length"
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

    <UButton
      v-if="!readOnly"
      :to="`/plants/${plant.id}/edit`"
      block
      size="lg"
      class="rounded-xl"
    >
      {{ t('plants.changeSettings') }}
    </UButton>
  </div>
</template>
