<script setup lang="ts">
import type { SpeciesProfile } from '#shared/types/species'
import type { SpeciesCareFieldKey } from '#shared/utils/species/profileCompleteness'
import { resolveSectionDisplay } from '#shared/utils/species/buildSpeciesDisplay'
import { isUnavailableField } from '#shared/utils/species/profileCompleteness'

const { t, locale } = useI18n()
const { apiErrorMessage } = useApiError()

const props = defineProps<{
  plantId: string
  species: string | null
}>()

const { fetchSpeciesProfile } = useSpeciesProfile()

const loading = ref(!!props.species?.trim())
const refreshing = ref(false)
const profile = ref<SpeciesProfile | null>(null)
const loaded = ref(false)
const errorMessage = ref<string | null>(null)
const contentRoot = ref<HTMLElement | null>(null)

const appLocale = computed(() => (locale.value === 'en' ? 'en' : 'es') as 'es' | 'en')

const sections = computed(() => [
  {
    id: 'watering',
    label: t('species.sectionWatering'),
    cards: [{ title: t('species.sectionWatering'), field: 'watering' as const }]
  },
  {
    id: 'light',
    label: t('species.sectionLight'),
    cards: [{ title: t('species.sectionLight'), field: 'light' as const }]
  },
  {
    id: 'humidity',
    label: t('species.sectionHumidity'),
    cards: [{ title: t('species.sectionHumidity'), field: 'humidity' as const }]
  },
  {
    id: 'fertilizing',
    label: t('species.sectionFertilizing'),
    cards: [{ title: t('species.sectionFertilizing'), field: 'fertilizing' as const }]
  },
  {
    id: 'soil-repotting',
    label: t('species.sectionSoilRepotting'),
    cards: [
      { title: t('species.soilTitle'), field: 'soil' as const },
      { title: t('species.repottingTitle'), field: 'repotting' as const }
    ]
  },
  {
    id: 'toxicity',
    label: t('species.sectionToxicity'),
    cards: [{ title: t('species.sectionToxicity'), field: 'toxicity' as const }]
  },
  {
    id: 'characteristics',
    label: t('species.sectionCharacteristics'),
    cards: [{ title: t('species.sectionCharacteristics'), field: 'characteristics' as const }]
  },
  {
    id: 'temperature',
    label: t('species.sectionTemperature'),
    cards: [{ title: t('species.sectionTemperature'), field: 'temperature' as const }]
  },
  {
    id: 'pests',
    label: t('species.sectionPests'),
    cards: [{ title: t('species.sectionPests'), field: 'pestsAndProblems' as const }]
  }
])

const navItems = computed(() => sections.value.map(section => ({
  id: section.id,
  label: section.label
})))

const sectionIds = computed(() => navItems.value.map(i => i.id))

const { activeSection, scrollToSection, setupObserver } = useSpeciesSectionNav(sectionIds)

function sectionBlocks(key: SpeciesCareFieldKey) {
  if (!profile.value) return []
  const display = resolveSectionDisplay(profile.value, key, appLocale.value)
  return display.blocks
}

function sectionFallbackText(key: SpeciesCareFieldKey): string | null {
  if (!profile.value || sectionBlocks(key).length > 0) return null
  const text = profile.value[key]
  return isUnavailableField(text, appLocale.value) ? null : text
}

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
    errorMessage.value = apiErrorMessage(e) || t('plants.profileLoadFailed')
    profile.value = null
  } finally {
    loading.value = false
    refreshing.value = false
    nextTick(() => setupObserver(contentRoot.value))
  }
}

onMounted(() => {
  if (props.species?.trim()) {
    void load()
  }
})

watch(() => props.species, (next, prev) => {
  if (next?.trim() && next !== prev) {
    profile.value = null
    loaded.value = false
    void load()
  }
})

watch(profile, () => {
  nextTick(() => setupObserver(contentRoot.value))
})

defineExpose({ load })
</script>

<template>
  <div class="space-y-4">
    <UAlert
      v-if="!species?.trim()"
      color="neutral"
      icon="i-lucide-info"
      :title="t('plants.speciesNotSet')"
      :description="t('plants.speciesNotSetHint')"
    >
      <template #actions>
        <UButton
          :to="`/plants/${plantId}/edit`"
          size="sm"
          variant="soft"
        >
          {{ t('plants.edit') }}
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
          {{ t('plants.refreshProfile') }}
        </UButton>
      </div>

      <div
        v-if="loading"
        class="space-y-3"
      >
        <USkeleton class="aspect-[4/3] w-full rounded-2xl" />
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-20"
        />
      </div>

      <UAlert
        v-else-if="errorMessage"
        color="error"
        :title="errorMessage"
      />

      <UAlert
        v-else-if="loaded && !profile"
        color="neutral"
        icon="i-lucide-book-open"
        :title="t('plants.profileNotLoaded')"
        :description="t('plants.profileNotLoadedHint')"
      >
        <template #actions>
          <UButton
            size="sm"
            variant="soft"
            icon="i-lucide-refresh-cw"
            :loading="refreshing"
            @click="load(true)"
          >
            {{ t('plants.refreshProfile') }}
          </UButton>
        </template>
      </UAlert>

      <template v-else-if="profile">
        <div
          v-if="profile.imageUrl"
          class="rounded-2xl overflow-hidden"
        >
          <img
            :src="profile.imageUrl"
            :alt="profile.commonName"
            class="w-full aspect-[4/3] object-cover"
          >
        </div>

        <UAlert
          v-if="profile.perenualId < 0"
          color="neutral"
          variant="subtle"
          icon="i-lucide-sparkles"
          :description="t('plants.profileAiGenerated')"
          class="mb-2"
        />

        <div>
          <h2 class="text-lg font-semibold">
            {{ profile.commonName }}
          </h2>
          <p
            v-if="profile.scientificName.length"
            class="text-sm text-muted italic"
          >
            {{ profile.scientificName.join(', ') }}
          </p>
        </div>

        <PlantsSpeciesPlantSpeciesQuickSummary :profile="profile" />

        <PlantsSpeciesPlantSpeciesSectionNav
          :items="navItems"
          :active-id="activeSection"
          @select="scrollToSection"
        />

        <div
          ref="contentRoot"
          class="space-y-8 pt-2"
        >
          <section
            v-for="section in sections"
            :id="section.id"
            :key="section.id"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesFieldCard
              v-for="card in section.cards"
              :key="card.field"
              :title="card.title"
              :blocks="sectionBlocks(card.field)"
              :fallback="sectionFallbackText(card.field)"
            />
          </section>
        </div>

        <p class="text-xs text-muted text-center pt-2">
          {{ t('plants.perenualCredit') }}
          <a
            href="https://perenual.com"
            target="_blank"
            rel="noopener"
            class="underline"
          >Perenual</a>
          <span v-if="profile.imageLicense">{{ t('plants.imageLicense', { license: profile.imageLicense }) }}</span>
        </p>
      </template>
    </template>
  </div>
</template>
