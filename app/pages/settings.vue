<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const toast = useToast()
const { subscribe } = usePushNotifications()

const homeLat = ref(Number(config.public.homeLat))
const homeLon = ref(Number(config.public.homeLon))
const saving = ref(false)
const pushLoading = ref(false)

onMounted(async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon')
    .eq('user_id', user.value.id)
    .maybeSingle()
  if (data?.home_lat) homeLat.value = Number(data.home_lat)
  if (data?.home_lon) homeLon.value = Number(data.home_lon)
})

async function saveLocation() {
  if (!user.value) return
  saving.value = true
  try {
    await supabase.from('user_settings').upsert({
      user_id: user.value.id,
      home_lat: homeLat.value,
      home_lon: homeLon.value,
      updated_at: new Date().toISOString()
    })
    toast.add({ title: 'Ubicación guardada', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: 'Error', description: e instanceof Error ? e.message : '', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function enablePush() {
  pushLoading.value = true
  try {
    await subscribe()
    toast.add({ title: 'Notificaciones activadas', color: 'success' })
  } catch (e: unknown) {
    toast.add({
      title: 'No se pudieron activar',
      description: e instanceof Error ? e.message : '',
      color: 'error'
    })
  } finally {
    pushLoading.value = false
  }
}

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}

function useGeolocation() {
  navigator.geolocation?.getCurrentPosition((pos) => {
    homeLat.value = pos.coords.latitude
    homeLon.value = pos.coords.longitude
  })
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Ajustes</h1>

    <UCard>
      <template #header>Cuenta</template>
      <p class="text-sm text-muted">{{ user?.email }}</p>
      <UButton class="mt-3" variant="outline" color="neutral" @click="signOut">
        Cerrar sesión
      </UButton>
    </UCard>

    <UCard>
      <template #header>Ubicación del hogar</template>
      <p class="text-sm text-muted mb-3">
        Se usa para el clima en recomendaciones cuando no hay GPS disponible.
      </p>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <UFormField label="Latitud">
          <UInput v-model.number="homeLat" type="number" step="any" />
        </UFormField>
        <UFormField label="Longitud">
          <UInput v-model.number="homeLon" type="number" step="any" />
        </UFormField>
      </div>
      <div class="flex gap-2">
        <UButton variant="soft" icon="i-lucide-map-pin" @click="useGeolocation">
          Usar mi ubicación
        </UButton>
        <UButton :loading="saving" @click="saveLocation">
          Guardar
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>Notificaciones</template>
      <p class="text-sm text-muted mb-3">
        Recibe recordatorios diarios de tareas pendientes (requiere PWA instalada en iOS).
      </p>
      <UButton
        :loading="pushLoading"
        :disabled="!config.public.vapidPublicKey"
        icon="i-lucide-bell"
        @click="enablePush"
      >
        Activar notificaciones push
      </UButton>
      <p v-if="!config.public.vapidPublicKey" class="text-xs text-muted mt-2">
        Configura NUXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY
      </p>
    </UCard>
  </div>
</template>
