<script setup lang="ts">
import type { DiagnosisResponse } from '#shared/utils/plants/schemas'
import type { HealthStatus } from '#shared/types/database'

const route = useRoute()
const id = route.params.id as string
const { fetchPlant, updateHealthStatus } = usePlants()
const { diagnose } = useAiApi()
const toast = useToast()

const plantName = ref('')
const symptoms = ref('')
const imagePreview = ref<string | null>(null)
const imageBase64 = ref<string | undefined>()
const loading = ref(false)
const result = ref<DiagnosisResponse | null>(null)
const showHealthModal = ref(false)
const suggestedStatus = ref<HealthStatus | null>(null)

onMounted(async () => {
  const p = await fetchPlant(id)
  plantName.value = p.name
})

function onImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const data = reader.result as string
    imagePreview.value = data
    imageBase64.value = data
  }
  reader.readAsDataURL(file)
}

async function runDiagnose() {
  if (symptoms.value.length < 3) {
    toast.add({ title: 'Describe los síntomas', color: 'warning' })
    return
  }
  loading.value = true
  result.value = null
  try {
    const res = await diagnose(id, symptoms.value, imageBase64.value)
    result.value = res.diagnosis
    suggestedStatus.value = res.diagnosis.suggestedHealthStatus
    showHealthModal.value = true
  } catch (e: unknown) {
    toast.add({
      title: 'Error en diagnóstico',
      description: e instanceof Error ? e.message : 'Intenta de nuevo',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function applySuggestedStatus() {
  if (!suggestedStatus.value) return
  await updateHealthStatus(id, suggestedStatus.value)
  showHealthModal.value = false
  toast.add({ title: 'Estado actualizado', color: 'success' })
  await navigateTo(`/plants/${id}`)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Diagnosticar</h1>
      <p class="text-muted text-sm">{{ plantName }}</p>
    </div>

    <UFormField label="Síntomas" required>
      <UTextarea v-model="symptoms" placeholder="Ej. hojas amarillas en la punta, manchas marrones..." rows="4" />
    </UFormField>

    <UFormField label="Foto (opcional)">
      <input type="file" accept="image/*" @change="onImage">
      <img v-if="imagePreview" :src="imagePreview" class="mt-2 max-h-40 rounded-lg">
    </UFormField>

    <UButton block :loading="loading" icon="i-lucide-stethoscope" @click="runDiagnose">
      Analizar con IA
    </UButton>

    <UCard v-if="result">
      <p class="font-medium mb-2">{{ result.summary }}</p>
      <div class="space-y-3 text-sm">
        <div>
          <p class="font-medium">Causas probables</p>
          <ul class="list-disc pl-4 text-muted">
            <li v-for="(c, i) in result.probableCauses" :key="i">{{ c }}</li>
          </ul>
        </div>
        <div>
          <p class="font-medium">Acciones inmediatas</p>
          <ul class="list-disc pl-4 text-muted">
            <li v-for="(a, i) in result.immediateActions" :key="i">{{ a }}</li>
          </ul>
        </div>
        <p class="text-muted"><strong>Cuándo preocuparse:</strong> {{ result.whenToWorry }}</p>
      </div>
    </UCard>

    <UModal v-model:open="showHealthModal">
      <UCard>
        <template #header>¿Actualizar estado de la planta?</template>
        <p class="text-sm text-muted mb-4">
          La IA sugiere cambiar el estado según el diagnóstico.
        </p>
        <div class="flex gap-2">
          <UButton block @click="applySuggestedStatus">
            Actualizar estado
          </UButton>
          <UButton block variant="ghost" @click="showHealthModal = false">
            Mantener actual
          </UButton>
        </div>
      </UCard>
    </UModal>
  </div>
</template>
