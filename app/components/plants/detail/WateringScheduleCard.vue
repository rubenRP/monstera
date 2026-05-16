<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import type { WateringFactors } from '#shared/utils/care/adaptiveWatering'

const { t } = useI18n()

const props = defineProps<{
  plant: Plant
  factors: WateringFactors
  effectiveDays: number
}>()

const explainOpen = ref(false)

const baseDays = computed(
  () => props.plant.watering_base_interval_days ?? props.plant.watering_interval_days
)

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
  if (f.wetDelayDays > 0) {
    items.push({
      key: 'wet',
      label: t('care.factor.wetDelay', { days: f.wetDelayDays })
    })
  }
  return items
})
</script>

<template>
  <UCard>
    <template #header>
      <span class="font-medium text-sm">{{ t('care.wateringSchedule') }}</span>
    </template>
    <p class="text-sm">
      {{ t('care.wateringBaseEffective', { base: baseDays, effective: effectiveDays }) }}
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
