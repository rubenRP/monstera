<script setup lang="ts">
import type { SiteFormInput } from '#shared/utils/sites/schemas'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const { createSite } = useSites()
const loading = ref(false)
const toast = useToast()

async function onSubmit(data: SiteFormInput) {
  loading.value = true
  try {
    const site = await createSite(data)
    toast.add({ title: t('sites.created'), color: 'success' })
    await navigateTo(`/sites/${site.id}`)
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      {{ t('sites.newTitle') }}
    </h1>
    <SitesSiteForm
      :loading="loading"
      @submit="onSubmit"
    />
  </div>
</template>
