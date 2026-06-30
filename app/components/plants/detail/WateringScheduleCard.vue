<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import type { WateringFactors, WateringReferenceSource } from '#shared/utils/care/adaptiveWatering'

const { t } = useI18n()

const props = defineProps<{
  plant: Plant
  factors: WateringFactors
  effectiveDays: number
  referenceSource?: WateringReferenceSource
}>()

const explainOpen = ref(false)

const referenceSourceLabel = computed(() => {
  const source = props.referenceSource ?? 'default'
  return t(`care.referenceSource.${source}`)
})

function factorLabel(key: string, factor: number): string | null {
  if (factor === 1) return null
  return t(`care.factor.${key}`, { factor: factor.toFixed(2) })
}

const activeFactors = computed(() => {
  const f = props.factors
  const items: { key: string, label: string }[] = []
  items.push({
    key: 'season',
    label: t(`care.seasonLabel.${f.season}`, { factor: f.seasonFactor.toFixed(2) })
  })
  const pot = factorLabel('pot', f.potFactor)
  if (pot) items.push({ key: 'pot', label: pot })
  const substrate = factorLabel('substrate', f.substrateFactor)
  if (substrate) items.push({ key: 'substrate', label: substrate })
  const light = factorLabel('light', f.lightFactor)
  if (light) items.push({ key: 'light', label: light })
  const weather = factorLabel('weather', f.weatherFactor)
  if (weather) items.push({ key: 'weather', label: weather })
  const health = factorLabel('health', f.healthFactor)
  if (health) items.push({ key: 'health', label: health })
  const placement = factorLabel('placement', f.placementFactor)
  if (placement) items.push({ key: 'placement', label: placement })
  const distance = factorLabel('distance', f.distanceFactor)
  if (distance) items.push({ key: 'distance', label: distance })
  const drainage = factorLabel('drainage', f.drainageFactor)
  if (drainage) items.push({ key: 'drainage', label: drainage })
  if (f.wetDelayDays > 0) {
    items.push({
      key: 'wet',
      label: t('care.factor.wetDelay', { days: f.wetDelayDays })
    })
  }
  return items
})

const showExteriorWeatherHint = computed(() => {
  const p = props.plant.site?.placement
  return (p === 'outdoor' || p === 'semi_outdoor') && props.factors.weatherFactor === 1
})
</script>

<template>
  <UCard>
    <template #header>
      <span class="font-medium text-sm">{{ t('care.wateringSchedule') }}</span>
    </template>
    <p class="text-sm">
      {{ t('care.wateringIntervalDays', { days: effectiveDays }) }}
    </p>
    <p class="mt-1 text-xs text-muted">
      {{ referenceSourceLabel }}
    </p>
    <ul
      v-if="activeFactors.length"
      class="mt-2 text-xs text-muted space-y-0.5"
    >
      <li
        v-for="item in activeFactors"
        :key="item.key"
      >
        {{ item.label }}
      </li>
    </ul>
    <p
      v-if="showExteriorWeatherHint"
      class="mt-2 text-xs text-warning"
    >
      {{ t('care.exteriorWeatherHint') }}
    </p>
    <UButton
      class="mt-3"
      variant="link"
      size="xs"
      :padded="false"
      @click="explainOpen = true"
    >
      {{ t('care.howCalculated') }}
    </UButton>
    <UModal
      v-model:open="explainOpen"
      :title="t('care.howCalculatedTitle')"
    >
      <template #body>
        <p class="text-sm text-muted whitespace-pre-wrap">
          {{ t('care.howCalculatedBody') }}
        </p>
      </template>
    </UModal>
  </UCard>
</template>
