<script setup lang="ts">
import type { DiagnosisResponse } from '#shared/utils/plants/schemas'
import type { HealthStatus } from '#shared/types/database'
import { HEALTH_BADGE_CLASSES, HEALTH_ICONS } from '#shared/constants/plants'
import { compressImage } from '~/utils/compressImage'

const { t, tm, rt } = useI18n()
usePageTitle(() => t('diagnose.title'))
const { apiErrorMessage } = useApiError()
const { healthLabel } = usePlantEnumLabels()
const route = useRoute()
const id = route.params.id as string
const { fetchPlant, updateHealthStatus } = usePlants()
const { diagnose } = useAiApi()
const toast = useToast()

const plantName = ref('')
const currentHealth = ref<HealthStatus | null>(null)
const symptoms = ref('')
const symptomsError = ref<string | null>(null)
const image = ref<{ base64: string, mimeType: string } | undefined>()
const loading = ref(false)
const elapsed = ref(0)
const result = ref<DiagnosisResponse | null>(null)
const applyingHealth = ref(false)
let abort: AbortController | null = null
let ticker: ReturnType<typeof setInterval> | null = null

const symptomExamples = computed(() => {
  // tm() returns the raw messages; guard while locale messages are (re)loading
  const raw = tm('diagnose.examples') as unknown
  return Array.isArray(raw) ? raw.map(item => rt(item as never)) : []
})

/** Rotating status line while the AI works (it can take up to ~2 minutes). */
const progressMessage = computed(() => {
  if (elapsed.value < 8) return image.value ? t('diagnose.progressPhoto') : t('diagnose.progressReading')
  if (elapsed.value < 25) return t('diagnose.progressCauses')
  return t('diagnose.progressSlow')
})

const suggestionDiffers = computed(() =>
  !!result.value?.suggestedHealthStatus && result.value.suggestedHealthStatus !== currentHealth.value
)

onMounted(async () => {
  try {
    const p = await fetchPlant(id)
    if (p.archived_at) {
      toast.add({ title: t('plants.archivedReadOnly'), color: 'warning' })
      await navigateTo(`/plants/${id}`)
      return
    }
    plantName.value = p.name
    currentHealth.value = p.health_status
  } catch (e: unknown) {
    toast.add({ title: t('common.loadErrorTitle'), description: apiErrorMessage(e), color: 'error' })
  }
})

onBeforeUnmount(() => {
  abort?.abort()
  if (ticker) clearInterval(ticker)
})

async function onPhoto(file: File) {
  const compressed = await compressImage(file)
  const reader = new FileReader()
  reader.onload = () => {
    image.value = { base64: reader.result as string, mimeType: compressed.type || 'image/jpeg' }
  }
  reader.readAsDataURL(compressed)
}

function addExample(text: string) {
  const current = symptoms.value.trim()
  symptoms.value = current ? `${current}, ${text.toLowerCase()}` : text
  symptomsError.value = null
}

watch(symptoms, (value) => {
  if (symptomsError.value && value.trim().length >= 3) symptomsError.value = null
})

async function runDiagnose() {
  if (symptoms.value.trim().length < 3) {
    symptomsError.value = t('diagnose.symptomsRequired')
    return
  }
  loading.value = true
  result.value = null
  elapsed.value = 0
  abort = new AbortController()
  ticker = setInterval(() => {
    elapsed.value++
  }, 1000)
  try {
    const res = await diagnose(id, symptoms.value, image.value, abort.signal)
    result.value = res.diagnosis
  } catch (e: unknown) {
    if (abort?.signal.aborted) {
      toast.add({ title: t('diagnose.cancelled'), color: 'neutral' })
    } else {
      toast.add({
        title: t('diagnose.error'),
        description: apiErrorMessage(e) || t('common.tryAgain'),
        color: 'error'
      })
    }
  } finally {
    loading.value = false
    abort = null
    if (ticker) clearInterval(ticker)
    ticker = null
  }
}

function cancelDiagnose() {
  abort?.abort()
}

async function applySuggestedStatus() {
  const status = result.value?.suggestedHealthStatus
  if (!status) return
  applyingHealth.value = true
  try {
    await updateHealthStatus(id, status)
    currentHealth.value = status
    toast.add({ title: t('plants.healthUpdated'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    applyingHealth.value = false
  }
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
      :error="symptomsError ?? undefined"
      required
    >
      <UTextarea
        v-model="symptoms"
        class="w-full"
        :placeholder="t('diagnose.symptomsPlaceholder')"
        :rows="4"
        :disabled="loading"
      />
    </UFormField>

    <div class="-mt-3 flex flex-wrap gap-1.5">
      <UButton
        v-for="example in symptomExamples"
        :key="example"
        size="xs"
        variant="outline"
        color="neutral"
        class="rounded-full"
        icon="i-lucide-plus"
        :disabled="loading"
        @click="addExample(example)"
      >
        {{ example }}
      </UButton>
    </div>

    <UFormField :label="t('diagnose.photoOptional')">
      <AppPhotoPicker @select="onPhoto" />
    </UFormField>

    <div
      v-if="loading"
      class="space-y-3 rounded-2xl border border-default bg-elevated/50 p-4"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-5 animate-spin text-primary"
        />
        <p class="flex-1 text-sm font-medium">
          {{ progressMessage }}
        </p>
        <span class="text-xs text-muted tabular-nums">{{ elapsed }} s</span>
      </div>
      <UProgress
        animation="carousel"
        size="xs"
      />
      <UButton
        block
        variant="ghost"
        color="neutral"
        icon="i-lucide-x"
        @click="cancelDiagnose"
      >
        {{ t('common.cancel') }}
      </UButton>
    </div>

    <UButton
      v-else
      block
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

      <div
        v-if="suggestionDiffers && result.suggestedHealthStatus"
        class="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-default p-3"
      >
        <p class="flex-1 text-sm">
          {{ t('diagnose.suggestedHealth') }}
          <span
            class="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
            :class="HEALTH_BADGE_CLASSES[result.suggestedHealthStatus]"
          >
            <UIcon
              :name="HEALTH_ICONS[result.suggestedHealthStatus]"
              class="size-3.5"
            />
            {{ healthLabel(result.suggestedHealthStatus) }}
          </span>
        </p>
        <UButton
          size="sm"
          :loading="applyingHealth"
          @click="applySuggestedStatus"
        >
          {{ t('diagnose.updateHealth') }}
        </UButton>
      </div>

      <template #footer>
        <p class="flex items-start gap-1.5 text-xs text-muted">
          <UIcon
            name="i-lucide-info"
            class="mt-0.5 size-3.5 shrink-0"
          />
          {{ t('diagnose.disclaimer') }}
        </p>
      </template>
    </UCard>
  </div>
</template>
