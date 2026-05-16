<script setup lang="ts">
import type { SpeciesProfile } from '#shared/types/species'

const props = defineProps<{
  plantId: string
  species: string | null
}>()

const { fetchSpeciesProfile } = useSpeciesProfile()
const toast = useToast()

const loading = ref(false)
const refreshing = ref(false)
const profile = ref<SpeciesProfile | null>(null)
const loaded = ref(false)
const errorMessage = ref<string | null>(null)

const sections = [
  { key: 'watering', label: 'Riego', icon: 'i-lucide-droplets' },
  { key: 'light', label: 'Luz', icon: 'i-lucide-sun' },
  { key: 'humidity', label: 'Humedad', icon: 'i-lucide-cloud-rain' },
  { key: 'fertilizing', label: 'Fertilizado', icon: 'i-lucide-flask-conical' },
  { key: 'soil', label: 'Suelo', icon: 'i-lucide-mountain' },
  { key: 'repotting', label: 'Replantado', icon: 'i-lucide-shovel' },
  { key: 'toxicity', label: 'Toxicidad', icon: 'i-lucide-skull' },
  { key: 'characteristics', label: 'Características', icon: 'i-lucide-sparkles' },
  { key: 'temperature', label: 'Temperaturas', icon: 'i-lucide-thermometer' },
  { key: 'pestsAndProblems', label: 'Problemas y plagas', icon: 'i-lucide-bug' }
] as const

async function load(refresh = false) {
  if (!props.species?.trim()) {
    loaded.value = true
    return
  }
  if (refresh) refreshing.value = true
  else loading.value = true
  errorMessage.value = null
  try {
    const res = await fetchSpeciesProfile(props.plantId, refresh)
    profile.value = res.profile
    loaded.value = true
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : 'No se pudo cargar la ficha'
    profile.value = null
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function sectionText(key: typeof sections[number]['key']): string {
  if (!profile.value) return ''
  return profile.value[key]
}

defineExpose({ load })
</script>

<template>
  <div class="space-y-4">
    <UAlert
      v-if="!species?.trim()"
      color="neutral"
      icon="i-lucide-info"
      title="Especie no indicada"
      description="Añade la especie en el formulario de edición para ver información de la variedad."
    >
      <template #actions>
        <UButton :to="`/plants/${plantId}/edit`" size="sm" variant="soft">
          Editar planta
        </UButton>
      </template>
    </UAlert>

    <template v-else>
      <div class="flex justify-end">
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="refreshing"
          @click="load(true)"
        >
          Actualizar ficha
        </UButton>
      </div>

      <div v-if="loading" class="space-y-3">
        <USkeleton class="h-40 w-full rounded-xl" />
        <USkeleton v-for="i in 4" :key="i" class="h-20" />
      </div>

      <UAlert
        v-else-if="errorMessage"
        color="error"
        :title="errorMessage"
      />

      <template v-else-if="profile">
        <div v-if="profile.imageUrl" class="rounded-xl overflow-hidden">
          <img
            :src="profile.imageUrl"
            :alt="profile.commonName"
            class="w-full h-48 object-cover"
          >
        </div>

        <div>
          <h2 class="text-lg font-semibold">{{ profile.commonName }}</h2>
          <p v-if="profile.scientificName.length" class="text-sm text-muted italic">
            {{ profile.scientificName.join(', ') }}
          </p>
        </div>

        <PlantsDetailPlantInfoSection
          v-for="section in sections"
          :key="section.key"
          :title="section.label"
          :icon="section.icon"
        >
          <p class="text-sm text-muted whitespace-pre-wrap">{{ sectionText(section.key) }}</p>
        </PlantsDetailPlantInfoSection>

        <p class="text-xs text-muted text-center pt-2">
          Datos de
          <a href="https://perenual.com" target="_blank" rel="noopener" class="underline">Perenual</a>
          <span v-if="profile.imageLicense"> · Imagen: {{ profile.imageLicense }}</span>
        </p>
      </template>
    </template>
  </div>
</template>
