<script setup lang="ts">
import type { CareTask, HealthStatus, Plant } from '#shared/types/database'
import { checkInFormSchema, type CheckInFormInput } from '#shared/utils/checkIn/schemas'

const { t } = useI18n()
const { validationMessage } = useApiError()
const { fetchPlant } = usePlants()

const open = defineModel<boolean>('open', { required: true })
const task = defineModel<CareTask | null>('task', { default: null })

const emit = defineEmits<{
  submit: [form: CheckInFormInput, photo?: File]
}>()

const loading = ref(false)
const saving = ref(false)
const plant = ref<Plant | null>(null)
const photoFile = ref<File | null>(null)
const errors = ref<string | null>(null)

const healthNote = ref('')
const checkInNotes = ref('')

const form = reactive({
  health_status: 'healthy' as HealthStatus,
  height_cm: null as number | null,
  new_leaves: false,
  dropped_leaves: false,
  flowering: false,
  size_changed: false
})

const plantName = computed(() => task.value?.plant?.name ?? plant.value?.name ?? '')

watch([open, task], async ([isOpen, currentTask]) => {
  if (!isOpen || !currentTask) {
    plant.value = null
    photoFile.value = null
    errors.value = null
    return
  }
  loading.value = true
  try {
    const p = await fetchPlant(currentTask.plant_id)
    plant.value = p
    form.health_status = p.health_status
    healthNote.value = p.health_status_note ?? ''
    form.height_cm = p.height_cm
    form.new_leaves = false
    form.dropped_leaves = false
    form.flowering = false
    form.size_changed = false
    checkInNotes.value = ''
  } finally {
    loading.value = false
  }
})

function onPhotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  photoFile.value = file ?? null
}

function onSubmit() {
  errors.value = null
  const parsed = checkInFormSchema.safeParse({
    ...form,
    health_status_note: healthNote.value || null,
    notes: checkInNotes.value || null
  })
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message
    errors.value = msg ? validationMessage(msg) : t('common.formInvalid')
    return
  }
  emit('submit', parsed.data, photoFile.value ?? undefined)
  saving.value = true
}

function setSaving(v: boolean) {
  saving.value = v
}

defineExpose({ setSaving })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('checkIn.title', { plant: plantName })"
  >
    <template #body>
      <div
        v-if="loading"
        class="space-y-3"
      >
        <USkeleton class="h-10" />
        <USkeleton class="h-24" />
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <p class="text-sm text-muted">
          {{ t('checkIn.subtitle') }}
        </p>

        <div>
          <p class="text-sm font-medium mb-2">
            {{ t('plants.healthStatus') }}
          </p>
          <PlantsHealthSemaphore
            v-model="form.health_status as HealthStatus"
            v-model:note="healthNote"
          />
        </div>

        <UFormField :label="t('checkIn.height')">
          <UInput
            :model-value="form.height_cm ?? undefined"
            type="number"
            min="1"
            :placeholder="t('checkIn.heightPlaceholder')"
            @update:model-value="form.height_cm = ($event as number | undefined) ?? null"
          />
        </UFormField>

        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">
            {{ t('checkIn.observations') }}
          </legend>
          <UCheckbox
            v-model="form.new_leaves"
            :label="t('checkIn.newLeaves')"
          />
          <UCheckbox
            v-model="form.dropped_leaves"
            :label="t('checkIn.droppedLeaves')"
          />
          <UCheckbox
            v-model="form.flowering"
            :label="t('checkIn.flowering')"
          />
          <UCheckbox
            v-model="form.size_changed"
            :label="t('checkIn.sizeChanged')"
          />
        </fieldset>

        <UFormField :label="t('checkIn.notes')">
          <UTextarea
            v-model="checkInNotes"
            :rows="3"
          />
        </UFormField>

        <UFormField :label="t('checkIn.photo')">
          <input
            type="file"
            accept="image/*"
            class="text-sm"
            @change="onPhotoChange"
          >
        </UFormField>

        <UAlert
          v-if="errors"
          color="error"
          :title="errors"
        />

        <div class="flex gap-2 pt-2">
          <UButton
            type="button"
            variant="soft"
            color="neutral"
            class="flex-1"
            @click="() => { open = false }"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            class="flex-1"
            :loading="saving"
          >
            {{ t('checkIn.save') }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
