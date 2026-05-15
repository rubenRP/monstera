<script setup lang="ts">
import type { SiteFormInput } from '#shared/utils/sites/schemas'

const { createSite } = useSites()
const loading = ref(false)
const toast = useToast()

async function onSubmit(data: SiteFormInput) {
  loading.value = true
  try {
    const site = await createSite(data)
    toast.add({ title: 'Sitio creado', color: 'success' })
    await navigateTo(`/sites/${site.id}`)
  } catch (e: unknown) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : '',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Nuevo sitio</h1>
    <SitesSiteForm :loading="loading" @submit="onSubmit" />
  </div>
</template>
