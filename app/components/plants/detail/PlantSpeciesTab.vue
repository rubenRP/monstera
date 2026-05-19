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

const navItems = computed(() => [
  { id: 'watering' as const, label: t('species.sectionWatering') },
  { id: 'light' as const, label: t('species.sectionLight') },
  { id: 'humidity' as const, label: t('species.sectionHumidity') },
  { id: 'fertilizing' as const, label: t('species.sectionFertilizing') },
  { id: 'soil-repotting' as const, label: t('species.sectionSoilRepotting') },
  { id: 'toxicity' as const, label: t('species.sectionToxicity') },
  { id: 'characteristics' as const, label: t('species.sectionCharacteristics') },
  { id: 'temperature' as const, label: t('species.sectionTemperature') },
  { id: 'pests' as const, label: t('species.sectionPests') }
])

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
        <USkeleton class="h-40 w-full rounded-xl" />
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
          class="rounded-xl overflow-hidden"
        >
          <img
            :src="profile.imageUrl"
            :alt="profile.commonName"
            class="w-full h-48 object-cover"
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
            id="watering"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionWatering')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('watering').length"
                :blocks="sectionBlocks('watering')"
              />
              <p
                v-else-if="sectionFallbackText('watering')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('watering') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="light"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionLight')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('light').length"
                :blocks="sectionBlocks('light')"
              />
              <p
                v-else-if="sectionFallbackText('light')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('light') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="humidity"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionHumidity')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('humidity').length"
                :blocks="sectionBlocks('humidity')"
              />
              <p
                v-else-if="sectionFallbackText('humidity')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('humidity') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="fertilizing"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionFertilizing')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('fertilizing').length"
                :blocks="sectionBlocks('fertilizing')"
              />
              <p
                v-else-if="sectionFallbackText('fertilizing')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('fertilizing') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="soil-repotting"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.soilTitle')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('soil').length"
                :blocks="sectionBlocks('soil')"
              />
              <p
                v-else-if="sectionFallbackText('soil')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('soil') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.repottingTitle')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('repotting').length"
                :blocks="sectionBlocks('repotting')"
              />
              <p
                v-else-if="sectionFallbackText('repotting')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('repotting') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="toxicity"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionToxicity')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('toxicity').length"
                :blocks="sectionBlocks('toxicity')"
              />
              <p
                v-else-if="sectionFallbackText('toxicity')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('toxicity') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="characteristics"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionCharacteristics')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('characteristics').length"
                :blocks="sectionBlocks('characteristics')"
              />
              <p
                v-else-if="sectionFallbackText('characteristics')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('characteristics') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="temperature"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionTemperature')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('temperature').length"
                :blocks="sectionBlocks('temperature')"
              />
              <p
                v-else-if="sectionFallbackText('temperature')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('temperature') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
          </section>

          <section
            id="pests"
            class="scroll-mt-28 space-y-3"
          >
            <PlantsSpeciesPlantSpeciesSectionCard :title="t('species.sectionPests')">
              <PlantsSpeciesPlantSpeciesBlockRenderer
                v-if="sectionBlocks('pestsAndProblems').length"
                :blocks="sectionBlocks('pestsAndProblems')"
              />
              <p
                v-else-if="sectionFallbackText('pestsAndProblems')"
                class="text-sm text-toned whitespace-pre-wrap"
              >
                {{ sectionFallbackText('pestsAndProblems') }}
              </p>
              <p
                v-else
                class="text-sm text-muted"
              >
                {{ t('species.unavailable') }}
              </p>
            </PlantsSpeciesPlantSpeciesSectionCard>
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
