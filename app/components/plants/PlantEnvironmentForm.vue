<script setup lang="ts">
import type { Site } from '#shared/types/database'
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const { t } = useI18n()
const { potSizeOptions, potMaterialOptions, substrateOptions } = usePlantEnumLabels()
const { placementLabel, orientationLabel, luminosityLabel } = useSiteEnumLabels()

const form = defineModel<PlantFormInput>('form', { required: true })

const { fetchSites } = useSites()
const sites = ref<Site[]>([])
const siteOptions = ref<{ label: string, value: string | null }[]>([])
const loadingSites = ref(true)

onMounted(async () => {
  try {
    const list = await fetchSites()
    sites.value = list
    siteOptions.value = [
      { label: t('common.noSite'), value: null },
      ...list.map(s => ({ label: s.name, value: s.id }))
    ]
  } finally {
    loadingSites.value = false
  }
})

const linkedSite = computed(() => {
  if (!form.value.site_id) return null
  return sites.value.find(s => s.id === form.value.site_id) ?? null
})

const showDistance = computed(() => {
  const placement = linkedSite.value?.placement
  return !!form.value.site_id
    && (placement === 'indoor' || placement === 'semi_outdoor' || placement == null)
})

const showOrientationOnSite = computed(() => {
  const placement = linkedSite.value?.placement
  return placement === 'indoor' || placement === 'semi_outdoor' || placement == null
})

const noneOption = computed(() => ({ label: t('common.none'), value: null }))
</script>

<template>
  <div class="space-y-8">
    <section
      id="section-plant"
      class="space-y-4"
    >
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('plants.formSectionPlant') }}
      </h2>
      <UFormField :label="t('plants.heightLabel')">
        <UInput
          :model-value="form.height_cm ?? undefined"
          type="number"
          :placeholder="t('plants.heightPlaceholder')"
          @update:model-value="form.height_cm = ($event as number | undefined) ?? null"
        />
      </UFormField>
      <UFormField :label="t('plants.fieldAge')">
        <div class="flex gap-2">
          <UInput
            :model-value="form.age_years ?? undefined"
            type="number"
            min="1"
            :max="form.age_unit === 'months' ? 1200 : 200"
            class="flex-1"
            :placeholder="t('plants.agePlaceholder')"
            @update:model-value="form.age_years = ($event as number | undefined) ?? null"
          />
          <USelect
            :model-value="form.age_unit ?? 'years'"
            class="w-28 shrink-0"
            :items="[
              { label: t('plants.ageUnitYears'), value: 'years' },
              { label: t('plants.ageUnitMonths'), value: 'months' }
            ]"
            @update:model-value="form.age_unit = ($event as 'months' | 'years')"
          />
        </div>
        <template #hint>
          {{ t('plants.ageHint') }}
        </template>
      </UFormField>
    </section>

    <section
      id="section-pot"
      class="space-y-4"
    >
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('plants.formSectionPot') }}
      </h2>
      <UFormField :label="t('plants.potSizeLabel')">
        <USelect
          :model-value="form.pot_size ?? undefined"
          :items="[noneOption, ...potSizeOptions]"
          @update:model-value="form.pot_size = ($event as typeof form.pot_size) ?? null"
        />
      </UFormField>
      <UFormField :label="t('plants.potDiameterLabel')">
        <UInput
          :model-value="form.pot_diameter_cm ?? undefined"
          type="number"
          @update:model-value="form.pot_diameter_cm = ($event as number | undefined) ?? null"
        />
      </UFormField>
      <UFormField :label="t('plants.potMaterialLabel')">
        <USelect
          :model-value="form.pot_material ?? undefined"
          :items="[noneOption, ...potMaterialOptions]"
          @update:model-value="form.pot_material = ($event as typeof form.pot_material) ?? null"
        />
      </UFormField>
      <UFormField>
        <UCheckbox
          v-model="form.has_drainage"
          :label="t('plants.drainageCheckbox')"
        />
      </UFormField>
      <UFormField :label="t('plants.fieldSubstrate')">
        <USelect
          :model-value="form.substrate_type ?? undefined"
          :items="[noneOption, ...substrateOptions]"
          @update:model-value="form.substrate_type = ($event as typeof form.substrate_type) ?? null"
        />
      </UFormField>
      <UFormField
        v-if="form.substrate_type === 'other'"
        :label="t('plants.substrateDetail')"
      >
        <UTextarea
          :model-value="form.substrate_notes ?? undefined"
          @update:model-value="form.substrate_notes = ($event as string | undefined) ?? null"
        />
      </UFormField>
    </section>

    <section
      id="section-light"
      class="space-y-4"
    >
      <h2 class="text-sm font-semibold text-highlighted">
        {{ t('plants.formSectionLight') }}
      </h2>
      <UFormField :label="t('plants.fieldSite')">
        <USelect
          :model-value="form.site_id ?? undefined"
          :items="siteOptions"
          :loading="loadingSites"
          :placeholder="t('plants.selectSite')"
          @update:model-value="form.site_id = ($event as string | null | undefined) ?? null"
        />
        <template #hint>
          <span class="text-xs text-muted">
            <NuxtLink
              to="/sites/new"
              class="text-primary underline"
            >{{ t('plants.createNewSite') }}</NuxtLink>
            · {{ t('plants.siteOrientationHint') }}
          </span>
        </template>
      </UFormField>

      <div
        v-if="linkedSite"
        class="rounded-lg border border-default p-3 space-y-2 bg-elevated/30"
      >
        <p class="text-xs font-medium text-muted">
          {{ t('plants.siteReadonlyTitle', { name: linkedSite.name }) }}
        </p>
        <ul class="text-sm space-y-1">
          <li>
            <span class="text-muted">{{ t('plants.fieldPlacementShort') }}:</span>
            {{ placementLabel(linkedSite.placement) }}
          </li>
          <li v-if="linkedSite.luminosity">
            <span class="text-muted">{{ t('plants.fieldLightLevel') }}:</span>
            {{ luminosityLabel(linkedSite.luminosity) }}
          </li>
          <li v-else>
            <span class="text-muted">{{ t('plants.fieldLightLevel') }}:</span>
            <span class="text-warning">{{ t('plants.missingInfo') }}</span>
          </li>
          <li v-if="showOrientationOnSite">
            <span class="text-muted">{{ t('plants.fieldOrientation') }}:</span>
            <template v-if="linkedSite.window_orientation">
              {{ orientationLabel(linkedSite.window_orientation) }}
            </template>
            <span
              v-else
              class="text-warning"
            >{{ t('plants.missingInfo') }}</span>
          </li>
        </ul>
        <UButton
          :to="`/sites/${linkedSite.id}/edit`"
          variant="soft"
          size="xs"
          color="neutral"
        >
          {{ t('plants.editLinkedSite') }}
        </UButton>
      </div>

      <UAlert
        v-else
        color="warning"
        variant="soft"
        :title="t('plants.noSiteLinkedTitle')"
        :description="t('plants.noSiteLinkedHint')"
      />

      <UFormField
        v-if="showDistance"
        :label="t('plants.windowDistance')"
      >
        <UInput
          :model-value="form.window_distance_cm ?? undefined"
          type="number"
          min="0"
          max="500"
          :placeholder="t('plants.windowDistancePlaceholder')"
          @update:model-value="form.window_distance_cm = ($event as number | undefined) ?? null"
        />
        <template #hint>
          {{ t('plants.windowDistancePlantHint') }}
        </template>
      </UFormField>
    </section>
  </div>
</template>
