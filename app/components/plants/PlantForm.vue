<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'
import { plantFormSchema, type PlantFormInput } from '#shared/utils/plants/schemas'
import type { Plant } from '#shared/types/database'

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
  watering_interval_days: props.initial?.watering_interval_days ?? 7,
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
  age_years: props.initial?.age_years ?? null
})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const errors = ref<string | null>(null)

function onPhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

function handleSubmit() {
  const parsed = plantFormSchema.safeParse(form)
  if (!parsed.success) {
    errors.value = parsed.error.errors[0]?.message ?? 'Revisa el formulario'
    return
  }
  errors.value = null
  emit('submit', parsed.data, photoFile.value ?? undefined)
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <UAlert v-if="errors" color="error" :title="errors" />

    <UFormField label="Nombre" required>
      <UInput v-model="form.name" placeholder="Ej. Monstera del salón" />
    </UFormField>

    <UFormField label="Especie">
      <UInput v-model="form.species" placeholder="Opcional" />
    </UFormField>

    <UFormField label="Foto">
      <input type="file" accept="image/*" class="text-sm" @change="onPhotoChange">
      <img v-if="photoPreview" :src="photoPreview" class="mt-2 w-24 h-24 object-cover rounded-lg">
    </UFormField>

    <div>
      <p class="text-sm font-medium mb-2">Estado de salud</p>
      <PlantsHealthSemaphore
        v-model="form.health_status"
        v-model:note="form.health_status_note"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Riego cada (días)">
        <UInput v-model.number="form.watering_interval_days" type="number" min="1" />
      </UFormField>
      <UFormField label="Fertilizar cada (días)">
        <UInput v-model.number="form.fertilizing_interval_days" type="number" min="1" />
      </UFormField>
    </div>

    <PlantsPlantEnvironmentForm v-model:form="form" />

    <UFormField label="Notas">
      <UTextarea v-model="form.notes" />
    </UFormField>

    <UButton type="submit" block :loading="loading" color="primary">
      Guardar
    </UButton>
  </form>
</template>
