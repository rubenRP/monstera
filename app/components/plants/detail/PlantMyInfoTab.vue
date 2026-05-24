<script setup lang="ts">
import type { CareTask, HealthStatus, Plant } from '#shared/types/database'
import type { WateringScheduleResult } from '#shared/utils/care/adaptiveWatering'
import { HEALTH_ICONS, HEALTH_ICON_CLASSES } from '#shared/constants/plants'
import {
  countPlantCompleteness,
  editSectionHash,
  type PlantFormSection
} from '#shared/utils/plants/plantCompleteness'
import type { PlantInfoGridItem } from './PlantInfoGridSection.vue'
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'
import { defaultPlantAgeUnit, formatPlantAge } from '#shared/utils/plants/formatPlantAge'

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
const { fetchHomeLat, computeScheduleForPlant, countRecentWetSkips } = useAdaptiveWatering()
const { snapshot: weatherSnapshot, load: loadWeather } = usePlantHomeWeather()

const wateringSchedule = ref<WateringScheduleResult | null>(null)

const empty = computed(() => t('plants.missingInfo'))
const editBase = computed(() => `/plants/${props.plant.id}/edit`)
const addLabel = computed(() => t('plants.addInSettings'))

const completeness = computed(() => countPlantCompleteness(props.plant))

async function loadWateringSchedule() {
  const homeLat = await fetchHomeLat()
  const wetCount = await countRecentWetSkips(props.plant.id)
  wateringSchedule.value = await computeScheduleForPlant(props.plant, homeLat, {
    recentWetSkipCount: wetCount
  })
}

watch(() => props.plant, () => {
  void loadWateringSchedule()
  void loadWeather()
}, { immediate: true, deep: true })

function taskDueLabel(dueAt: string): string {
  const overdue = overdueDays(dueAt)
  if (overdue > 0) return overdueLabel(dueAt)
  if (overdue === 0) return t('care.dueToday')
  const days = -overdue
  if (days === 1) return t('care.dueTomorrow')
  return t('care.dueInDays', { days })
}

function gridItem(
  label: string,
  sublabel: string,
  icon: string,
  iconTone?: SpeciesDisplayIconTone,
  missing = false,
  editTo?: string
): PlantInfoGridItem {
  return {
    label,
    sublabel,
    icon,
    iconTone,
    missing,
    editTo: missing ? editTo : undefined,
    editLabel: missing ? addLabel.value : undefined
  }
}

function missingItem(
  sublabel: string,
  icon: string,
  iconTone?: SpeciesDisplayIconTone,
  section?: PlantFormSection
): PlantInfoGridItem {
  const to = section
    ? `${editBase.value}#section-${editSectionHash(section)}`
    : editBase.value
  return gridItem(empty.value, sublabel, icon, iconTone, true, to)
}

function missingSiteField(
  sublabel: string,
  icon: string,
  iconTone?: SpeciesDisplayIconTone
): PlantInfoGridItem {
  const siteId = props.plant.site_id
  const to = siteId
    ? `/sites/${siteId}/edit`
    : `${editBase.value}#section-light`
  return gridItem(empty.value, sublabel, icon, iconTone, true, to)
}

const currentMonthLabel = computed(() => {
  return new Date().toLocaleDateString(dateLocale.value, { month: 'long' })
})

const lightItems = computed((): PlantInfoGridItem[] => {
  const site = props.plant.site
  const items: PlantInfoGridItem[] = []

  if (site?.luminosity) {
    items.push(gridItem(
      luminosityLabel(site.luminosity),
      t('plants.fieldLightLevel'),
      'i-lucide-sun',
      'amber'
    ))
  } else {
    items.push(site
      ? missingSiteField(t('plants.fieldLightLevel'), 'i-lucide-lightbulb', 'amber')
      : missingItem(t('plants.fieldLightLevel'), 'i-lucide-lightbulb', 'amber', 'light'))
  }

  items.push(
    site?.window_orientation
      ? gridItem(
          orientationLabel(site.window_orientation),
          t('plants.fieldOrientation'),
          'i-lucide-compass',
          'amber'
        )
      : site
        ? missingSiteField(t('plants.fieldOrientation'), 'i-lucide-compass', 'amber')
        : missingItem(t('plants.fieldOrientation'), 'i-lucide-compass', 'amber', 'light')
  )

  items.push(
    props.plant.window_distance_cm != null
      ? gridItem(
          `${props.plant.window_distance_cm} ${t('common.cm')}`,
          t('plants.fieldWindowDistance'),
          'i-lucide-ruler',
          'amber'
        )
      : missingItem(t('plants.fieldWindowDistance'), 'i-lucide-ruler', 'amber', 'light')
  )

  return items
})

const potItems = computed((): PlantInfoGridItem[] => [
  props.plant.pot_material
    ? gridItem(
        potMaterialLabel(props.plant.pot_material),
        t('plants.fieldPotType'),
        'i-lucide-flower-2',
        'brown'
      )
    : missingItem(t('plants.fieldPotType'), 'i-lucide-flower-2', 'brown', 'pot'),
  props.plant.pot_diameter_cm != null
    ? gridItem(
        `${props.plant.pot_diameter_cm} ${t('common.cm')}`,
        t('plants.fieldPotSize'),
        'i-lucide-circle',
        'brown'
      )
    : props.plant.pot_size
      ? gridItem(
          potSizeLabel(props.plant.pot_size),
          t('plants.fieldPotSize'),
          'i-lucide-circle',
          'brown'
        )
      : missingItem(t('plants.fieldPotSize'), 'i-lucide-circle', 'brown', 'pot'),
  gridItem(
    props.plant.has_drainage ? t('common.yes') : t('common.no'),
    t('plants.fieldDrainage'),
    'i-lucide-droplets',
    'blue'
  ),
  props.plant.substrate_type
    ? gridItem(
        substrateLabel(props.plant.substrate_type),
        t('plants.fieldSoilType'),
        'i-lucide-mountain',
        'brown'
      )
    : missingItem(t('plants.fieldSoilType'), 'i-lucide-mountain', 'brown', 'pot')
])

const plantItems = computed((): PlantInfoGridItem[] => [
  props.plant.height_cm != null
    ? gridItem(
        `${props.plant.height_cm} ${t('common.cm')}`,
        t('plants.fieldPlantSize'),
        'i-lucide-ruler',
        'primary'
      )
    : missingItem(t('plants.fieldPlantSize'), 'i-lucide-sprout', 'primary', 'plant'),
  props.plant.age_years != null
    ? gridItem(
        formatPlantAge(
          props.plant.age_years,
          defaultPlantAgeUnit(props.plant.age_years, props.plant.age_unit),
          t
        ),
        t('plants.fieldPlantAge'),
        'i-lucide-cake',
        'primary'
      )
    : missingItem(t('plants.fieldPlantAge'), 'i-lucide-cake', 'primary', 'plant'),
  props.plant.species?.trim()
    ? gridItem(
        props.plant.species.trim(),
        t('plants.fieldPlantType'),
        'i-lucide-leaf',
        'primary'
      )
    : missingItem(t('plants.fieldPlantType'), 'i-lucide-leaf', 'primary', 'plant')
])

function homeComfortItem(
  label: string | undefined,
  sublabel: string,
  icon: string
): PlantInfoGridItem {
  const w = weatherSnapshot.value
  const settingsLink = '/settings'
  const configureLabel = t('plants.configureHomeLocation')
  if (label && label !== empty.value) {
    return gridItem(label, sublabel, icon, 'blue')
  }
  return {
    ...gridItem(empty.value, sublabel, icon, 'blue', true),
    editTo: w?.hasLocation === false ? settingsLink : undefined,
    editLabel: w?.hasLocation === false ? configureLabel : addLabel.value
  }
}

const siteItems = computed((): PlantInfoGridItem[] => {
  const site = props.plant.site
  const w = weatherSnapshot.value
  const items: PlantInfoGridItem[] = [
    homeComfortItem(w?.indoorTempLabel, t('plants.fieldHomeIndoorTemp'), 'i-lucide-thermometer'),
    homeComfortItem(w?.humidityLabel, t('plants.fieldHomeHumidity'), 'i-lucide-droplets')
  ]

  items.push(
    site
      ? gridItem(
          placementLabel(site.placement),
          t('plants.fieldPlacementShort'),
          site.placement === 'indoor' ? 'i-lucide-home' : 'i-lucide-tree-pine',
          'primary'
        )
      : missingItem(t('plants.fieldPlacementShort'), 'i-lucide-home', 'primary', 'light')
  )

  if (site?.name) {
    items.push(gridItem(
      site.name,
      t('plants.fieldSite'),
      'i-lucide-map-pin',
      'neutral'
    ))
  }

  if (site) {
    items.push(gridItem(
      site.has_ceiling_cover ? t('common.yes') : t('common.no'),
      t('plants.fieldCeiling'),
      'i-lucide-umbrella',
      'neutral'
    ))
  }

  return items
})

const climateItems = computed((): PlantInfoGridItem[] => {
  const w = weatherSnapshot.value
  const settingsLink = '/settings'
  const configureLabel = t('plants.configureHomeLocation')
  return [
    gridItem(
      currentMonthLabel.value,
      t('plants.fieldCurrentMonth'),
      'i-lucide-calendar',
      'neutral'
    ),
    w
      ? gridItem(
          w.outdoorTempLabel,
          t('plants.fieldOutdoorTemp'),
          'i-lucide-thermometer-sun',
          'amber',
          w.outdoorTempLabel === empty.value,
          w.outdoorTempLabel === empty.value && !w.hasLocation ? settingsLink : `${editBase.value}`
        )
      : (() => {
          const item = missingItem(t('plants.fieldOutdoorTemp'), 'i-lucide-thermometer-sun', 'amber')
          return { ...item, editTo: settingsLink, editLabel: configureLabel }
        })(),
    w?.hasLocation
      ? gridItem(
          t('plants.locationConfigured'),
          t('plants.fieldClimate'),
          'i-lucide-map-pin',
          'primary'
        )
      : (() => {
          const item = missingItem(t('plants.fieldClimate'), 'i-lucide-map-pin', 'primary')
          return { ...item, editTo: settingsLink, editLabel: configureLabel }
        })()
  ]
})
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

    <PlantsPlantVarietyReference
      v-if="plant.species?.trim()"
      :species="plant.species"
      :plant-id="plant.id"
    />

    <PlantsDetailPlantInfoGridSection
      :title="t('plants.lighting')"
      :items="lightItems"
    >
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
