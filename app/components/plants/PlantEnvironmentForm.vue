<script setup lang="ts">
import {
  POT_MATERIAL_OPTIONS,
  POT_SIZE_OPTIONS,
  SUBSTRATE_OPTIONS
} from '#shared/constants/plants'
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const form = defineModel<PlantFormInput>('form', { required: true })
const open = ref(false)

const { fetchSites } = useSites()
const sites = ref<{ label: string, value: string }[]>([])
const loadingSites = ref(true)

onMounted(async () => {
  try {
    const list = await fetchSites()
    sites.value = [
      { label: '— Sin sitio', value: null },
      ...list.map(s => ({ label: s.name, value: s.id }))
    ]
  } finally {
    loadingSites.value = false
  }
})

const showDistance = computed(() => !!form.value.site_id)
</script>

<template>
  <UCollapsible v-model:open="open">
    <UButton
      variant="ghost"
      color="neutral"
      block
      trailing-icon="i-lucide-chevron-down"
      :ui="{ trailingIcon: open ? 'rotate-180 transition-transform' : 'transition-transform' }"
    >
      Maceta y sustrato (opcional)
    </UButton>
    <template #content>
      <div class="space-y-4 pt-4">
        <UFormField label="Sitio">
          <USelect
            v-model="form.site_id"
            :items="sites"
            :loading="loadingSites"
            placeholder="Selecciona un sitio"
          />
          <p class="text-xs text-muted mt-1">
            <NuxtLink to="/sites/new" class="text-primary underline">Crear sitio nuevo</NuxtLink>
            · La ubicación y la luz se configuran en Sitios
          </p>
        </UFormField>

        <UFormField v-if="showDistance" label="Distancia a la ventana (cm)">
          <UInput
            v-model.number="form.window_distance_cm"
            type="number"
            min="0"
            max="500"
            placeholder="Distancia de esta planta a la ventana del sitio"
          />
        </UFormField>

        <UFormField label="Tamaño de maceta">
          <USelect
            v-model="form.pot_size"
            :items="[{ label: '—', value: null }, ...POT_SIZE_OPTIONS.map(o => ({ label: o.label, value: o.value }))]"
          />
        </UFormField>
        <UFormField label="Diámetro maceta (cm)">
          <UInput v-model.number="form.pot_diameter_cm" type="number" />
        </UFormField>
        <UFormField label="Material de maceta">
          <USelect
            v-model="form.pot_material"
            :items="[{ label: '—', value: null }, ...POT_MATERIAL_OPTIONS.map(o => ({ label: o.label, value: o.value }))]"
          />
        </UFormField>
        <UFormField>
          <UCheckbox v-model="form.has_drainage" label="Maceta con drenaje (agujeros)" />
        </UFormField>
        <UFormField label="Sustrato">
          <USelect
            v-model="form.substrate_type"
            :items="[{ label: '—', value: null }, ...SUBSTRATE_OPTIONS.map(o => ({ label: o.label, value: o.value }))]"
          />
        </UFormField>
        <UFormField v-if="form.substrate_type === 'other'" label="Detalle sustrato">
          <UTextarea v-model="form.substrate_notes" />
        </UFormField>
        <UFormField label="Altura de la planta (cm)">
          <UInput v-model.number="form.height_cm" type="number" placeholder="Altura total aproximada" />
        </UFormField>
        <UFormField label="Antigüedad (años)">
          <UInput v-model.number="form.age_years" type="number" min="1" placeholder="Ej. 3" />
        </UFormField>
      </div>
    </template>
  </UCollapsible>
</template>
