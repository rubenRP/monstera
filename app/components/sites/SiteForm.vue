<script setup lang="ts">
import {
  LUMINOSITY_OPTIONS,
  PLACEMENT_OPTIONS,
  WINDOW_ORIENTATION_OPTIONS
} from '#shared/constants/sites'
import { siteFormSchema, type SiteFormInput } from '#shared/utils/sites/schemas'
import type { Site } from '#shared/types/database'

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

watch(() => form.placement, (p) => {
  if (p === 'outdoor') {
    form.window_orientation = null
  }
})

function handleSubmit() {
  const parsed = siteFormSchema.safeParse(form)
  if (!parsed.success) {
    errors.value = parsed.error.errors[0]?.message ?? 'Revisa el formulario'
    return
  }
  errors.value = null
  emit('submit', parsed.data)
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <UAlert v-if="errors" color="error" :title="errors" />

    <UFormField label="Nombre del sitio" required>
      <UInput v-model="form.name" placeholder="Ej. Despacho, Terraza norte" />
    </UFormField>

    <UFormField label="Tipo de ubicación">
      <USelect
        v-model="form.placement"
        :items="PLACEMENT_OPTIONS.map(o => ({ label: o.label, value: o.value }))"
      />
    </UFormField>

    <template v-if="showLightFields">
      <UFormField label="Orientación (ventana o zona luminosa)">
        <div class="grid grid-cols-4 gap-2">
          <UButton
            v-for="opt in WINDOW_ORIENTATION_OPTIONS"
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
        <p class="text-xs text-muted mt-1">{{ WINDOW_ORIENTATION_OPTIONS.find(o => o.value === form.window_orientation)?.label }}</p>
      </UFormField>

      <UFormField label="Luminosidad">
        <USelect
          v-model="form.luminosity"
          :items="[{ label: '—', value: null }, ...LUMINOSITY_OPTIONS.map(o => ({ label: o.label, value: o.value }))]"
        />
      </UFormField>
    </template>

    <UFormField v-if="showCeiling">
      <UCheckbox
        v-model="form.has_ceiling_cover"
        label="Tiene techo o cubierta (p. ej. terraza con toldo/pergola)"
      />
    </UFormField>

    <UFormField label="Notas">
      <UTextarea v-model="form.notes" placeholder="Detalles del espacio" />
    </UFormField>

    <UButton type="submit" block :loading="loading">
      Guardar sitio
    </UButton>
  </form>
</template>
