<script setup lang="ts">
import type { DiagnosisResponse } from '#shared/utils/plants/schemas'
import type { HealthStatus } from '#shared/types/database'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
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
    toast.add({ title: t('diagnose.symptomsRequired'), color: 'warning' })
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
      title: t('diagnose.error'),
      description: apiErrorMessage(e) || t('common.tryAgain'),
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
  toast.add({ title: t('plants.healthUpdated'), color: 'success' })
  await navigateTo(`/plants/${id}`)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        {{ t('diagnose.title') }}
      </h1>
      <p class="text-muted text-sm">
        {{ plantName }}
      </p>
    </div>

    <UFormField
      :label="t('diagnose.symptoms')"
      required
    >
      <UTextarea
        v-model="symptoms"
        :placeholder="t('diagnose.symptomsPlaceholder')"
        :rows="4"
      />
    </UFormField>

    <UFormField :label="t('diagnose.photoOptional')">
      <input
        type="file"
        accept="image/*"
        @change="onImage"
      >
      <img
        v-if="imagePreview"
        :src="imagePreview"
        class="mt-2 max-h-40 rounded-lg"
      >
    </UFormField>

    <UButton
      block
      :loading="loading"
      icon="i-lucide-stethoscope"
      @click="runDiagnose"
    >
      {{ t('diagnose.analyze') }}
    </UButton>

    <UCard v-if="result">
      <p class="font-medium mb-2">
        {{ result.summary }}
      </p>
      <div class="space-y-3 text-sm">
        <div>
          <p class="font-medium">
            {{ t('diagnose.probableCauses') }}
          </p>
          <ul class="list-disc pl-4 text-muted">
            <li
              v-for="(c, i) in result.probableCauses"
              :key="i"
            >
              {{ c }}
            </li>
          </ul>
        </div>
        <div>
          <p class="font-medium">
            {{ t('diagnose.immediateActions') }}
          </p>
          <ul class="list-disc pl-4 text-muted">
            <li
              v-for="(a, i) in result.immediateActions"
              :key="i"
            >
              {{ a }}
            </li>
          </ul>
        </div>
        <p class="text-muted">
          <strong>{{ t('diagnose.whenToWorry') }}</strong> {{ result.whenToWorry }}
        </p>
      </div>
    </UCard>

    <UModal
      v-model:open="showHealthModal"
      :title="t('diagnose.updateHealthTitle')"
    >
      <template #body>
        <p class="text-sm text-muted mb-4">
          {{ t('diagnose.updateHealthBody') }}
        </p>
        <div class="flex gap-2">
          <UButton
            block
            @click="applySuggestedStatus"
          >
            {{ t('diagnose.updateHealth') }}
          </UButton>
          <UButton
            block
            variant="ghost"
            @click="showHealthModal = false"
          >
            {{ t('diagnose.keepCurrent') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
