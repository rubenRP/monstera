<script setup lang="ts">
const { fetchSites } = useSites()
const sites = ref<Awaited<ReturnType<typeof fetchSites>>>([])
const loading = ref(true)

onMounted(async () => {
  try {
    sites.value = await fetchSites()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Sitios</h1>
        <p class="text-sm text-muted">Espacios donde viven tus plantas</p>
      </div>
      <UButton to="/sites/new" icon="i-lucide-plus" size="sm">
        Nuevo
      </UButton>
    </div>

    <div v-if="loading" class="space-y-3">
      <USkeleton v-for="i in 3" :key="i" class="h-20" />
    </div>

    <UAlert
      v-else-if="!sites.length"
      icon="i-lucide-map-pin"
      title="Sin sitios"
      description="Crea un sitio (despacho, terraza…) y asígnalo al registrar plantas."
    >
      <template #actions>
        <UButton to="/sites/new" size="sm">
          Crear sitio
        </UButton>
      </template>
    </UAlert>

    <ul v-else class="space-y-3">
      <li v-for="site in sites" :key="site.id">
        <SitesSiteCard :site="site" />
      </li>
    </ul>
  </div>
</template>
