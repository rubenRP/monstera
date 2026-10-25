<script setup lang="ts">
import type { HealthStatus, Plant } from '#shared/types/database'
import type { SpeciesSuggestion } from '#shared/types/species'
import { plantFormSchema, type PlantFormInput } from '#shared/utils/plants/schemas'
import { fieldErrorsFromZod } from '#shared/utils/forms/fieldErrors'
import { DEFAULT_FERTILIZE_DAYS, suggestFertilizeDays } from '#shared/utils/plants/fertilizeDefault'

const { t } = useI18n()
const { validationMessage } = useApiError()

const props = defineProps<{
  initial?: Plant | null
  loading?: boolean
  /** Signed URL of the current photo (edit) */
  photoSrc?: string | null
  /** Where Cancel goes */
  cancelTo: string
}>()

const emit = defineEmits<{
  submit: [data: PlantFormInput, photo?: File, options?: { removePhoto: boolean }]
}>()

/** Visual order of the fields, used to scroll to the first error. */
const FIELD_ORDER = [
  'name', 'species', 'health_status_note', 'height_cm', 'age_years', 'pot_size', 'pot_diameter_cm',
  'pot_material', 'substrate_type', 'substrate_notes', 'site_id', 'window_distance_cm',
  'fertilizing_interval_days', 'check_in_interval_days', 'notes'
]

const form = reactive<PlantFormInput>({
  name: props.initial?.name ?? '',
  species: props.initial?.species ?? '',
  notes: props.initial?.notes ?? '',
  health_status: (props.initial?.health_status ?? 'healthy') as HealthStatus,
  health_status_note: props.initial?.health_status_note ?? '',
  fertilizing_interval_days: props.initial?.fertilizing_interval_days ?? 30,
  check_in_interval_days: props.initial?.check_in_interval_days ?? 30,
  site_id: props.initial?.site_id ?? null,
  window_distance_cm: props.initial?.window_distance_cm ?? null,
  pot_size: props.initial?.pot_size ?? null,
  pot_diameter_cm: props.initial?.pot_diameter_cm ?? null,
  pot_material: props.initial?.pot_material ?? null,
  has_drainage: props.initial?.has_drainage ?? false,
  substrate_type: props.initial?.substrate_type ?? null,
  substrate_notes: props.initial?.substrate_notes ?? '',
  height_cm: props.initial?.height_cm ?? null,
  age_years: props.initial?.age_years ?? null,
  age_unit: props.initial?.age_unit ?? 'years'
})

const photoFile = ref<File | null>(null)
const removePhoto = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const errorCount = computed(() => Object.keys(fieldErrors.value).length)
const fertilizeSuggested = ref(false)
const suggestedFertilizeDays = ref<number | null>(null)
const fertilizeTouched = ref(!!props.initial?.id)

const initialSnapshot = JSON.stringify(form)
const submitted = ref(false)
const isDirty = computed(() =>
  !submitted.value && (JSON.stringify(form) !== initialSnapshot || !!photoFile.value || removePhoto.value)
)

const shownPhoto = computed(() => (removePhoto.value ? null : props.photoSrc ?? null))

function err(field: string): string | undefined {
  const key = fieldErrors.value[field]
  return key ? validationMessage(key) : undefined
}

function onPhotoSelect(file: File) {
  photoFile.value = file
  removePhoto.value = false
}

function onRemovePhoto() {
  photoFile.value = null
  removePhoto.value = true
}

// Re-validate a field as soon as the user fixes it
watch(form, () => {
  if (!errorCount.value) return
  const parsed = plantFormSchema.safeParse(form)
  fieldErrors.value = parsed.success ? {} : fieldErrorsFromZod(parsed.error, 'errors.validation.invalidValue')
}, { deep: true })

watch(() => form.fertilizing_interval_days, (value) => {
  if (value !== suggestedFertilizeDays.value) fertilizeTouched.value = true
})

const speciesQuery = computed(() => form.species)
const speciesFocused = ref(false)
const { suggestions, searching, clear: clearSuggestions } = useSpeciesSearch(speciesQuery)
const showSuggestions = computed(() => speciesFocused.value && suggestions.value.length > 0)

function pickSuggestion(item: SpeciesSuggestion) {
  const species = item.scientificName ?? item.commonName
  clearSuggestions(species)
  form.species = species
  if (!form.name.trim() && item.commonName) form.name = item.commonName
  // Only prefill the fertilizing interval if the user has not set one themselves
  if (!fertilizeTouched.value || form.fertilizing_interval_days === DEFAULT_FERTILIZE_DAYS) {
    const days = suggestFertilizeDays(item.watering)
    suggestedFertilizeDays.value = days
    form.fertilizing_interval_days = days
    fertilizeSuggested.value = true
  }
  speciesFocused.value = false
}

function onSpeciesBlur() {
  // Let a click on a suggestion land before hiding the list
  setTimeout(() => {
    speciesFocused.value = false
  }, 150)
}

async function scrollToFirstError() {
  await nextTick()
  const first = FIELD_ORDER.find(field => fieldErrors.value[field])
  const el = first ? document.getElementById(`field-${first}`) : null
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
}

function handleSubmit() {
  const parsed = plantFormSchema.safeParse(form)
  if (!parsed.success) {
    fieldErrors.value = fieldErrorsFromZod(parsed.error, 'errors.validation.invalidValue')
    void scrollToFirstError()
    return
  }
  fieldErrors.value = {}
  submitted.value = true
  emit('submit', parsed.data, photoFile.value ?? undefined, { removePhoto: removePhoto.value })
}

/** Lets the parent re-arm the unsaved-changes guard after a failed save. */
function onSaveFailed() {
  submitted.value = false
}
defineExpose({ onSaveFailed })

// Unsaved changes: confirm before leaving inside the app, and on tab close / reload
const leaveModalOpen = ref(false)
let resolveLeave: ((ok: boolean) => void) | null = null

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  leaveModalOpen.value = true
  return new Promise<boolean>((resolve) => {
    resolveLeave = resolve
  })
})

function answerLeave(ok: boolean) {
  leaveModalOpen.value = false
  resolveLeave?.(ok)
  resolveLeave = null
}

watch(leaveModalOpen, (open) => {
  if (!open && resolveLeave) answerLeave(false)
})

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) return
  event.preventDefault()
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <form
    class="space-y-6"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <UAlert
      v-if="errorCount"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="t('plants.formErrors', { count: errorCount }, errorCount)"
    />

    <UFormField
      id="field-name"
      :label="t('plants.name')"
      :error="err('name')"
      required
    >
      <UInput
        v-model="form.name"
        class="w-full"
        :placeholder="t('plants.namePlaceholder')"
      />
    </UFormField>

    <UFormField
      id="field-species"
      :label="t('plants.species')"
      :hint="t('common.optional')"
      :description="t('plants.speciesSearchHint')"
    >
      <div class="relative">
        <UInput
          :model-value="form.species ?? undefined"
          class="w-full"
          icon="i-lucide-search"
          :loading="searching"
          autocomplete="off"
          :placeholder="t('plants.speciesPlaceholder')"
          role="combobox"
          :aria-expanded="showSuggestions"
          aria-controls="species-suggestions"
          @update:model-value="form.species = ($event as string | undefined) ?? null"
          @focus="speciesFocused = true"
          @blur="onSpeciesBlur"
        />
        <ul
          v-if="showSuggestions"
          id="species-suggestions"
          role="listbox"
          class="absolute inset-x-0 top-full z-40 mt-1 max-h-72 overflow-auto rounded-xl border border-default bg-default p-1 shadow-lg"
        >
          <li
            v-for="item in suggestions"
            :key="item.id"
            role="option"
            :aria-selected="false"
          >
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none"
              @mousedown.prevent="pickSuggestion(item)"
              @click="pickSuggestion(item)"
            >
              <PlantsPlantAvatar
                size="sm"
                :name="item.commonName ?? item.scientificName ?? '?'"
                :photo-src="item.thumbnail"
              />
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium capitalize">{{ item.commonName ?? item.scientificName }}</span>
                <span
                  v-if="item.scientificName && item.commonName"
                  class="block truncate text-xs italic text-muted"
                >{{ item.scientificName }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </UFormField>

    <PlantsPlantVarietyReference
      :species="form.species"
      :plant-id="initial?.id"
    />

    <UFormField :label="t('plants.photo')">
      <AppPhotoPicker
        :preview="shownPhoto"
        @select="onPhotoSelect"
      />
      <UButton
        v-if="(shownPhoto || photoFile) && !removePhoto"
        class="mt-2"
        size="sm"
        variant="ghost"
        color="neutral"
        icon="i-lucide-image-off"
        @click="onRemovePhoto"
      >
        {{ t('plants.removePhoto') }}
      </UButton>
      <p
        v-else-if="removePhoto"
        class="mt-2 text-xs text-muted"
      >
        {{ t('plants.photoWillBeRemoved') }}
      </p>
    </UFormField>

    <section
      id="section-health"
      class="space-y-3"
    >
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('plants.healthStatus') }}
      </h2>
      <PlantsHealthSemaphore
        v-model="form.health_status"
        v-model:note="form.health_status_note"
      />
    </section>

    <PlantsPlantEnvironmentForm
      v-model:form="form"
      :field-errors="fieldErrors"
    />

    <section
      id="section-care"
      class="space-y-4"
    >
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('plants.formSectionCare') }}
      </h2>
      <p class="text-xs text-muted">
        {{ t('plants.wateringAutoHint') }}
      </p>
      <div class="grid grid-cols-2 gap-4">
        <UFormField
          id="field-fertilizing_interval_days"
          :label="t('plants.fertilizeEvery')"
          :error="err('fertilizing_interval_days')"
          :help="fertilizeSuggested && form.fertilizing_interval_days === suggestedFertilizeDays ? t('plants.fertilizeSuggested') : undefined"
        >
          <UInput
            v-model.number="form.fertilizing_interval_days"
            type="number"
            min="1"
            max="365"
          />
        </UFormField>
        <UFormField
          id="field-check_in_interval_days"
          :label="t('plants.checkInEvery')"
          :error="err('check_in_interval_days')"
        >
          <UInput
            v-model.number="form.check_in_interval_days"
            type="number"
            min="7"
            max="180"
          />
        </UFormField>
      </div>
    </section>

    <UFormField
      id="field-notes"
      :label="t('plants.notes')"
    >
      <UTextarea
        v-model="form.notes"
        class="w-full"
      />
    </UFormField>

    <div class="sticky bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 -mx-4 flex gap-2 border-t border-default/80 bg-default/85 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
      <UButton
        :to="cancelTo"
        size="lg"
        color="neutral"
        variant="outline"
      >
        {{ t('common.cancel') }}
      </UButton>
      <UButton
        type="submit"
        block
        size="lg"
        class="flex-1"
        :loading="loading"
        color="primary"
      >
        {{ t('common.save') }}
      </UButton>
    </div>

    <AppConfirmModal
      v-model:open="leaveModalOpen"
      :title="t('plants.unsavedTitle')"
      :description="t('plants.unsavedDescription')"
      :confirm-label="t('plants.discardChanges')"
      confirm-color="warning"
      confirm-icon="i-lucide-undo-2"
      @confirm="answerLeave(true)"
    />
  </form>
</template>
