<script setup lang="ts">
import type { RecommendResponse } from '#shared/utils/plants/schemas'

const route = useRoute()
const id = route.params.id as string
const { fetchPlant } = usePlants()
const { recommend } = useAiApi()
const toast = useToast()

const plantName = ref('')
const loading = ref(false)
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
      title: 'Error',
      description: e instanceof Error ? e.message : 'No se pudieron obtener recomendaciones',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Recomendaciones</h1>
      <p class="text-muted text-sm">{{ plantName }}</p>
    </div>

    <UButton block :loading="loading" icon="i-lucide-cloud-sun" @click="loadRecommendations">
      Obtener recomendaciones
    </UButton>

    <UCard v-if="result">
      <div class="space-y-4 text-sm">
        <div>
          <p class="font-medium">Riego</p>
          <p class="text-muted">{{ result.wateringAdvice }}</p>
        </div>
        <div>
          <p class="font-medium">Fertilización</p>
          <p class="text-muted">{{ result.fertilizingAdvice }}</p>
        </div>
        <div>
          <p class="font-medium">Luz ({{ result.lightExposure.level }})</p>
          <p class="text-muted">{{ result.lightExposure.summary }}</p>
        </div>
        <div v-if="result.seasonalTips.length">
          <p class="font-medium">Consejos</p>
          <ul class="list-disc pl-4 text-muted">
            <li v-for="(t, i) in result.seasonalTips" :key="i">{{ t }}</li>
          </ul>
        </div>
        <UAlert v-if="result.riskFlags.length" color="warning" title="Alertas">
          <ul class="list-disc pl-4">
            <li v-for="(r, i) in result.riskFlags" :key="i">{{ r }}</li>
          </ul>
        </UAlert>
        <p class="text-muted italic">{{ result.environmentNotes }}</p>
      </div>
    </UCard>

    <UCard v-if="weather" variant="subtle">
      <template #header>Pronóstico</template>
      <pre class="text-xs whitespace-pre-wrap text-muted">{{ weather }}</pre>
    </UCard>
  </div>
</template>
