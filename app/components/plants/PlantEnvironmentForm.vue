<script setup lang="ts">
import type { PlantFormInput } from '#shared/utils/plants/schemas'

const { t } = useI18n()
const { potSizeOptions, potMaterialOptions, substrateOptions } = usePlantEnumLabels()

const form = defineModel<PlantFormInput>('form', { required: true })
const open = ref(false)

const { fetchSites } = useSites()
const sites = ref<{ label: string, value: string | null }[]>([])
const loadingSites = ref(true)

onMounted(async () => {
  try {
    const list = await fetchSites()
    sites.value = [
      { label: t('common.noSite'), value: null },
      ...list.map(s => ({ label: s.name, value: s.id }))
    ]
  } finally {
    loadingSites.value = false
  }
})

const showDistance = computed(() => !!form.value.site_id)

const noneOption = computed(() => ({ label: t('common.none'), value: null }))
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
      {{ t('plants.potSection') }}
    </UButton>
    <template #content>
      <div class="space-y-4 pt-4">
        <UFormField :label="t('plants.fieldSite')">
          <USelect
            v-model="form.site_id"
            :items="sites"
            :loading="loadingSites"
            :placeholder="t('plants.selectSite')"
          />
          <p class="text-xs text-muted mt-1">
            <NuxtLink
              to="/sites/new"
              class="text-primary underline"
            >{{ t('plants.createNewSite') }}</NuxtLink>
            · {{ t('plants.siteConfigHint') }}
          </p>
        </UFormField>

        <UFormField
          v-if="showDistance"
          :label="t('plants.windowDistance')"
        >
          <UInput
            v-model.number="form.window_distance_cm"
            type="number"
            min="0"
            max="500"
            :placeholder="t('plants.windowDistancePlaceholder')"
          />
        </UFormField>

        <UFormField :label="t('plants.potSizeLabel')">
          <USelect
            v-model="form.pot_size"
            :items="[noneOption, ...potSizeOptions]"
          />
        </UFormField>
        <UFormField :label="t('plants.potDiameterLabel')">
          <UInput
            v-model.number="form.pot_diameter_cm"
            type="number"
          />
        </UFormField>
        <UFormField :label="t('plants.potMaterialLabel')">
          <USelect
            v-model="form.pot_material"
            :items="[noneOption, ...potMaterialOptions]"
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
            v-model="form.substrate_type"
            :items="[noneOption, ...substrateOptions]"
          />
        </UFormField>
        <UFormField
          v-if="form.substrate_type === 'other'"
          :label="t('plants.substrateDetail')"
        >
          <UTextarea v-model="form.substrate_notes" />
        </UFormField>
        <UFormField :label="t('plants.heightLabel')">
          <UInput
            v-model.number="form.height_cm"
            type="number"
            :placeholder="t('plants.heightPlaceholder')"
          />
        </UFormField>
        <UFormField :label="t('plants.fieldAge')">
          <UInput
            v-model.number="form.age_years"
            type="number"
            min="1"
            :placeholder="t('plants.agePlaceholder')"
          />
        </UFormField>
      </div>
    </template>
  </UCollapsible>
</template>
