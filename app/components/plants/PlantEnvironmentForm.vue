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
            :model-value="form.site_id ?? undefined"
            :items="sites"
            :loading="loadingSites"
            :placeholder="t('plants.selectSite')"
            @update:model-value="form.site_id = ($event as string | null | undefined) ?? null"
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
            :model-value="form.window_distance_cm ?? undefined"
            type="number"
            min="0"
            max="500"
            :placeholder="t('plants.windowDistancePlaceholder')"
            @update:model-value="form.window_distance_cm = ($event as number | undefined) ?? null"
          />
        </UFormField>

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
        <UFormField :label="t('plants.heightLabel')">
          <UInput
            :model-value="form.height_cm ?? undefined"
            type="number"
            :placeholder="t('plants.heightPlaceholder')"
            @update:model-value="form.height_cm = ($event as number | undefined) ?? null"
          />
        </UFormField>
        <UFormField :label="t('plants.fieldAge')">
          <UInput
            :model-value="form.age_years ?? undefined"
            type="number"
            min="1"
            :placeholder="t('plants.agePlaceholder')"
            @update:model-value="form.age_years = ($event as number | undefined) ?? null"
          />
        </UFormField>
      </div>
    </template>
  </UCollapsible>
</template>
