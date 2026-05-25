<script setup lang="ts">
import type { Plant } from '#shared/types/database'

const { t } = useI18n()
const { fetchSites } = useSites()

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  plant: Pick<Plant, 'id' | 'name' | 'site_id'>
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: [siteId: string | null]
}>()

const selectedSiteId = ref<string | null>(null)
const siteOptions = ref<{ label: string, value: string | null }[]>([])
const loadingSites = ref(false)

async function loadSites() {
  loadingSites.value = true
  try {
    const list = await fetchSites()
    const currentId = props.plant.site_id
    siteOptions.value = [
      { label: t('common.noSite'), value: null },
      ...list
        .filter(s => s.id !== currentId)
        .map(s => ({ label: s.name, value: s.id }))
    ]
    selectedSiteId.value = siteOptions.value[0]?.value ?? null
  } finally {
    loadingSites.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    void loadSites()
  }
})

function onSubmit() {
  const siteId = selectedSiteId.value ?? null
  if (siteId === props.plant.site_id) return
  emit('confirm', siteId)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('plants.moveSiteTitle')"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ t('plants.moveSiteDescription', { plant: plant.name }) }}
      </p>

      <UFormField
        :label="t('plants.moveSiteField')"
        class="mt-4"
      >
        <USelect
          v-model="selectedSiteId"
          :items="siteOptions"
          :loading="loadingSites"
          class="w-full"
        />
      </UFormField>

      <UButton
        class="mt-4"
        block
        icon="i-lucide-map-pin"
        :loading="loading || loadingSites"
        :disabled="loadingSites || selectedSiteId === plant.site_id"
        @click="onSubmit"
      >
        {{ t('plants.moveSiteConfirm') }}
      </UButton>
    </template>
  </UModal>
</template>
