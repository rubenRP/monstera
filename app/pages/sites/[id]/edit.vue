<script setup lang="ts">
import type { SiteFormInput } from '#shared/utils/sites/schemas'

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
    toast.add({ title: 'Sitio actualizado', color: 'success' })
    await navigateTo(`/sites/${id}`)
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: e instanceof Error ? e.message : '', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Editar sitio</h1>
    <USkeleton v-if="loading" class="h-64" />
    <SitesSiteForm v-else-if="site" :initial="site" :loading="saving" @submit="onSubmit" />
  </div>
</template>
