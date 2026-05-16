<script setup lang="ts">
import type { RecommendResponse } from '#shared/utils/plants/schemas'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const route = useRoute()
const id = route.params.id as string
const { fetchPlant } = usePlants()
const { recommend } = useAiApi()
const { applySuggestedBaseInterval } = useAdaptiveWatering()
const toast = useToast()

const plantName = ref('')
const loading = ref(false)
const applying = ref(false)
const result = ref<RecommendResponse | null>(null)
const weather = ref('')

onMounted(async () => {
  const p = await fetchPlant(id)
  plantName.value = p.name
})

async function loadRecommendations() {
  loading.value = true
  result.value = null
  try {
    let lat: number | undefined
    let lon: number | undefined
    if (navigator.geolocation) {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      }).catch(() => null)
      if (pos) {
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      }
    }
    const res = await recommend(id, lat, lon)
    result.value = res.recommendation
    weather.value = res.weatherSummary
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e) || t('recommend.fetchFailed'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function applySuggestedInterval() {
  const days = result.value?.suggestedWateringIntervalDays
  if (!days) return
  applying.value = true
  try {
    await applySuggestedBaseInterval(id, days)
    toast.add({
      title: t('recommend.intervalApplied'),
      description: t('recommend.intervalAppliedDesc', { days }),
      color: 'success'
    })
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        {{ t('recommend.title') }}
      </h1>
      <p class="text-muted text-sm">
        {{ plantName }}
      </p>
    </div>

    <UButton
      block
      :loading="loading"
      icon="i-lucide-cloud-sun"
      @click="loadRecommendations"
    >
      {{ t('recommend.fetch') }}
    </UButton>

    <UCard v-if="result">
      <div class="space-y-4 text-sm">
        <div
          v-if="result.suggestedWateringIntervalDays"
          class="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2"
        >
          <p class="font-medium">
            {{ t('recommend.suggestedInterval', { days: result.suggestedWateringIntervalDays }) }}
          </p>
          <p
            v-if="result.suggestedWateringIntervalRationale"
            class="text-muted text-xs"
          >
            {{ result.suggestedWateringIntervalRationale }}
          </p>
          <UButton
            size="sm"
            :loading="applying"
            @click="applySuggestedInterval"
          >
            {{ t('recommend.applyInterval') }}
          </UButton>
        </div>
        <div>
          <p class="font-medium">
            {{ t('recommend.watering') }}
          </p>
          <p class="text-muted">
            {{ result.wateringAdvice }}
          </p>
        </div>
        <div>
          <p class="font-medium">
            {{ t('recommend.fertilizing') }}
          </p>
          <p class="text-muted">
            {{ result.fertilizingAdvice }}
          </p>
        </div>
        <div>
          <p class="font-medium">
            {{ t('recommend.light', { level: result.lightExposure.level }) }}
          </p>
          <p class="text-muted">
            {{ result.lightExposure.summary }}
          </p>
        </div>
        <div v-if="result.seasonalTips.length">
          <p class="font-medium">
            {{ t('recommend.tips') }}
          </p>
          <ul class="list-disc pl-4 text-muted">
            <li
              v-for="(tip, i) in result.seasonalTips"
              :key="i"
            >
              {{ tip }}
            </li>
          </ul>
        </div>
        <UAlert
          v-if="result.riskFlags.length"
          color="warning"
          :title="t('recommend.alerts')"
        >
          <ul class="list-disc pl-4">
            <li
              v-for="(r, i) in result.riskFlags"
              :key="i"
            >
              {{ r }}
            </li>
          </ul>
        </UAlert>
        <p class="text-muted italic">
          {{ result.environmentNotes }}
        </p>
      </div>
    </UCard>

    <UCard
      v-if="weather"
      variant="subtle"
    >
      <template #header>
        {{ t('recommend.forecast') }}
      </template>
      <pre class="text-xs whitespace-pre-wrap text-muted">{{ weather }}</pre>
    </UCard>
  </div>
</template>
