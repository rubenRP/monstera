<script setup lang="ts">
import type { HealthStatus, Plant } from '#shared/types/database'
import { plantFormSchema, type PlantFormInput } from '#shared/utils/plants/schemas'
import { suggestWateringDaysFromProfile } from '#shared/utils/care/speciesWateringHint'
import type { SpeciesProfile } from '#shared/types/species'
import { normalizeSpeciesQuery } from '#shared/utils/species/normalize'

const { t } = useI18n()
const { validationMessage } = useApiError()
const supabase = useSupabaseClient()

const props = defineProps<{
  initial?: Plant | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: PlantFormInput, photo?: File]
}>()

const form = reactive<PlantFormInput>({
  name: props.initial?.name ?? '',
  species: props.initial?.species ?? '',
  notes: props.initial?.notes ?? '',
  health_status: (props.initial?.health_status ?? 'healthy') as HealthStatus,
  health_status_note: props.initial?.health_status_note ?? '',
  watering_base_interval_days: props.initial?.watering_base_interval_days
    ?? props.initial?.watering_interval_days ?? 7,
  fertilizing_interval_days: props.initial?.fertilizing_interval_days ?? 30,
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
const photoPreview = ref<string | null>(null)
const errors = ref<string | null>(null)
const wateringTouched = ref(!!props.initial)
const speciesProfileForSuggest = ref<SpeciesProfile | null>(null)

async function loadSpeciesSuggestion() {
  const query = form.species?.trim()
  if (!query) {
    speciesProfileForSuggest.value = null
    return
  }
  const normalized = normalizeSpeciesQuery(query)
  const { data } = await supabase
    .from('species_profiles')
    .select('profile')
    .eq('species_query', normalized)
    .maybeSingle()
  speciesProfileForSuggest.value = (data?.profile as SpeciesProfile | undefined) ?? null
  if (!props.initial && !wateringTouched.value) {
    const days = suggestWateringDaysFromProfile(speciesProfileForSuggest.value)
    if (days != null) {
      form.watering_base_interval_days = days
    }
  }
}

watch(() => form.species, () => {
  void loadSpeciesSuggestion()
}, { immediate: true })

function onPhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

function applyWateringSuggestion(days: number) {
  form.watering_base_interval_days = days
  wateringTouched.value = true
}

function onWateringInput() {
  wateringTouched.value = true
}

function handleSubmit() {
  const parsed = plantFormSchema.safeParse(form)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message
    errors.value = msg ? validationMessage(msg) : t('common.formInvalid')
    return
  }
  errors.value = null
  emit('submit', parsed.data, photoFile.value ?? undefined)
}
</script>

<template>
  <form
    class="space-y-6"
    @submit.prevent="handleSubmit"
  >
    <UAlert
      v-if="errors"
      color="error"
      :title="errors"
    />

    <UFormField
      :label="t('plants.name')"
      required
    >
      <UInput
        v-model="form.name"
        :placeholder="t('plants.namePlaceholder')"
      />
    </UFormField>

    <UFormField :label="t('plants.species')">
      <UInput
        :model-value="form.species ?? undefined"
        :placeholder="t('common.optional')"
        @update:model-value="form.species = ($event as string | undefined) ?? null"
      />
    </UFormField>

    <PlantsPlantVarietyReference
      :species="form.species"
      :plant-id="initial?.id"
      @apply-suggestion="applyWateringSuggestion"
    />

    <UFormField :label="t('plants.photo')">
      <input
        type="file"
        accept="image/*"
        class="text-sm"
        @change="onPhotoChange"
      >
      <img
        v-if="photoPreview"
        :src="photoPreview"
        class="mt-2 w-24 h-24 object-cover rounded-lg"
      >
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

    <PlantsPlantEnvironmentForm v-model:form="form" />

    <section
      id="section-care"
      class="space-y-4"
    >
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('plants.formSectionCare') }}
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <UFormField :label="t('plants.waterBaseEvery')">
          <UInput
            v-model.number="form.watering_base_interval_days"
            type="number"
            min="1"
            max="90"
            @input="onWateringInput"
          />
          <template #hint>
            {{ t('plants.waterBaseHint') }}
          </template>
        </UFormField>
        <UFormField :label="t('plants.fertilizeEvery')">
          <UInput
            v-model.number="form.fertilizing_interval_days"
            type="number"
            min="1"
          />
        </UFormField>
      </div>
    </section>

    <UFormField :label="t('plants.notes')">
      <UTextarea v-model="form.notes" />
    </UFormField>

    <UButton
      type="submit"
      block
      :loading="loading"
      color="primary"
    >
      {{ t('common.save') }}
    </UButton>
  </form>
</template>
