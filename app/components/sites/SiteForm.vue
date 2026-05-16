<script setup lang="ts">
import { siteFormSchema, type SiteFormInput } from '#shared/utils/sites/schemas'
import type { Site } from '#shared/types/database'

const { t } = useI18n()
const { validationMessage } = useApiError()
const {
  placementOptions,
  orientationOptions,
  luminosityOptions
} = useSiteEnumLabels()

const props = defineProps<{
  initial?: Site | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: SiteFormInput]
}>()

const form = reactive<SiteFormInput>({
  name: props.initial?.name ?? '',
  placement: props.initial?.placement ?? 'indoor',
  window_orientation: props.initial?.window_orientation ?? null,
  luminosity: props.initial?.luminosity ?? null,
  has_ceiling_cover: props.initial?.has_ceiling_cover ?? false,
  notes: props.initial?.notes ?? ''
})

const errors = ref<string | null>(null)

const showLightFields = computed(
  () => form.placement === 'indoor' || form.placement === 'semi_outdoor'
)
const showCeiling = computed(
  () => form.placement === 'semi_outdoor' || form.placement === 'outdoor'
)

const noneOption = computed(() => ({ label: t('common.none'), value: null }))

watch(() => form.placement, (p) => {
  if (p === 'outdoor') {
    form.window_orientation = null
  }
})

function handleSubmit() {
  const parsed = siteFormSchema.safeParse(form)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message
    errors.value = msg ? validationMessage(msg) : t('common.formInvalid')
    return
  }
  errors.value = null
  emit('submit', parsed.data)
}
</script>

<template>
  <form
    class="space-y-5"
    @submit.prevent="handleSubmit"
  >
    <UAlert
      v-if="errors"
      color="error"
      :title="errors"
    />

    <UFormField
      :label="t('sites.name')"
      required
    >
      <UInput
        v-model="form.name"
        :placeholder="t('sites.namePlaceholder')"
      />
    </UFormField>

    <UFormField :label="t('sites.placementType')">
      <USelect
        v-model="form.placement"
        :items="placementOptions"
      />
    </UFormField>

    <template v-if="showLightFields">
      <UFormField :label="t('sites.orientation')">
        <div class="grid grid-cols-4 gap-2">
          <UButton
            v-for="opt in orientationOptions"
            :key="opt.value"
            type="button"
            size="sm"
            :variant="form.window_orientation === opt.value ? 'solid' : 'outline'"
            :color="form.window_orientation === opt.value ? 'primary' : 'neutral'"
            @click="form.window_orientation = opt.value"
          >
            {{ opt.value }}
          </UButton>
        </div>
        <p class="text-xs text-muted mt-1">
          {{ orientationOptions.find(o => o.value === form.window_orientation)?.label }}
        </p>
      </UFormField>

      <UFormField :label="t('sites.luminosity')">
        <USelect
          v-model="form.luminosity"
          :items="[noneOption, ...luminosityOptions]"
        />
      </UFormField>
    </template>

    <UFormField v-if="showCeiling">
      <UCheckbox
        v-model="form.has_ceiling_cover"
        :label="t('sites.ceilingCheckbox')"
      />
    </UFormField>

    <UFormField :label="t('sites.notes')">
      <UTextarea
        v-model="form.notes"
        :placeholder="t('sites.notesPlaceholder')"
      />
    </UFormField>

    <UButton
      type="submit"
      block
      :loading="loading"
    >
      {{ t('sites.saveSite') }}
    </UButton>
  </form>
</template>
