<script setup lang="ts">
import type { SiteFormInput } from '#shared/utils/sites/schemas'

const { t } = useI18n()
const { apiErrorMessage } = useApiError()
const route = useRoute()
const id = route.params.id as string
const { fetchSite, updateSite } = useSites()
const site = ref<Awaited<ReturnType<typeof fetchSite>> | null>(null)
const loading = ref(true)
const saving = ref(false)
const toast = useToast()

onMounted(async () => {
  site.value = await fetchSite(id)
  loading.value = false
})

async function onSubmit(data: SiteFormInput) {
  saving.value = true
  try {
    await updateSite(id, data)
    toast.add({ title: t('sites.updated'), color: 'success' })
    await navigateTo(`/sites/${id}`)
  } catch (e: unknown) {
    toast.add({
      title: t('common.error'),
      description: apiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      {{ t('sites.editTitle') }}
    </h1>
    <USkeleton
      v-if="loading"
      class="h-64"
    />
    <SitesSiteForm
      v-else-if="site"
      :initial="site"
      :loading="saving"
      @submit="onSubmit"
    />
  </div>
</template>
