<script setup lang="ts">
import type { SpeciesProfile } from '#shared/types/species'
import { suggestWateringDaysFromProfile } from '#shared/utils/care/speciesWateringHint'
import { normalizeSpeciesQuery } from '#shared/utils/species/normalize'

const props = defineProps<{
  species: string | null | undefined
  plantId?: string
}>()

const emit = defineEmits<{
  applySuggestion: [days: number]
}>()

const { t } = useI18n()
const { fetchSpeciesProfile } = useSpeciesProfile()
const supabase = useSupabaseClient()

const profile = ref<SpeciesProfile | null>(null)
const loading = ref(false)
const suggestedDays = computed(() => suggestWateringDaysFromProfile(profile.value))

async function loadProfile() {
  const query = props.species?.trim()
  if (!query) {
    profile.value = null
    return
  }
  loading.value = true
  try {
    if (props.plantId) {
      const res = await fetchSpeciesProfile(props.plantId)
      profile.value = res.profile
      return
    }
    const normalized = normalizeSpeciesQuery(query)
    const { data } = await supabase
      .from('species_profiles')
      .select('profile')
      .eq('species_query', normalized)
      .maybeSingle()
    profile.value = (data?.profile as SpeciesProfile | undefined) ?? null
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
}

watch(() => [props.species, props.plantId], () => {
  void loadProfile()
}, { immediate: true })

const open = ref(false)
</script>

<template>
  <UCollapsible
    v-if="species?.trim()"
    v-model:open="open"
  >
    <UButton
      variant="ghost"
      color="neutral"
      block
      trailing-icon="i-lucide-chevron-down"
      :loading="loading"
      :ui="{ trailingIcon: open ? 'rotate-180 transition-transform' : 'transition-transform' }"
    >
      {{ t('plants.varietyReferenceTitle') }}
    </UButton>
    <template #content>
      <div
        v-if="profile"
        class="pt-3 space-y-3 text-sm"
      >
        <p class="text-xs text-muted flex items-center gap-1">
          <UIcon
            name="i-lucide-leaf"
            class="size-3.5"
          />
          {{ t('plants.fromVariety') }}
        </p>
        <div v-if="profile.watering">
          <p class="font-medium text-highlighted">
            {{ t('species.sectionWatering') }}
          </p>
          <p class="text-toned whitespace-pre-wrap mt-0.5">
            {{ profile.watering }}
          </p>
        </div>
        <div v-if="profile.light">
          <p class="font-medium text-highlighted">
            {{ t('species.sectionLight') }}
          </p>
          <p class="text-toned mt-0.5">
            {{ profile.light }}
          </p>
        </div>
        <div v-if="profile.humidity">
          <p class="font-medium text-highlighted">
            {{ t('species.sectionHumidity') }}
          </p>
          <p class="text-toned mt-0.5">
            {{ profile.humidity }}
          </p>
        </div>
        <div
          v-if="suggestedDays"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="text-muted">
            {{ t('plants.wateringSuggestDays', { days: suggestedDays }) }}
          </span>
          <UButton
            size="xs"
            variant="soft"
            @click="emit('applySuggestion', suggestedDays)"
          >
            {{ t('plants.useWateringSuggestion') }}
          </UButton>
        </div>
      </div>
      <p
        v-else-if="!loading"
        class="pt-3 text-xs text-muted"
      >
        {{ t('plants.varietyReferenceEmpty') }}
      </p>
    </template>
  </UCollapsible>
</template>
