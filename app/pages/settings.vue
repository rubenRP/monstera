<script setup lang="ts">
import type { AppLocale } from '#shared/types/database'

const { t, locales, locale, setLocale } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const toast = useToast()
const { apiErrorMessage } = useApiError()
const { subscribe } = usePushNotifications()

const homeLat = ref(Number(config.public.homeLat))
const homeLon = ref(Number(config.public.homeLon))
const saving = ref(false)
const pushLoading = ref(false)

const localeItems = computed(() =>
  locales.value.map(l => ({ label: l.name, value: l.code }))
)

onMounted(async () => {
  const userId = user.value?.id
  if (!userId) return
  const { data } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon, locale')
    .eq('user_id', userId)
    .maybeSingle()
  if (data?.home_lat) homeLat.value = Number(data.home_lat)
  if (data?.home_lon) homeLon.value = Number(data.home_lon)
})

async function saveLocation() {
  const userId = user.value?.id
  if (!userId) return
  saving.value = true
  try {
    await supabase.from('user_settings').upsert({
      user_id: userId,
      home_lat: homeLat.value,
      home_lon: homeLon.value,
      locale: locale.value as AppLocale,
      updated_at: new Date().toISOString()
    })
    toast.add({ title: t('settings.locationSaved'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function enablePush() {
  pushLoading.value = true
  try {
    await subscribe()
    toast.add({ title: t('settings.pushEnabled'), color: 'success' })
  } catch (e: unknown) {
    toast.add({
      title: t('settings.pushFailed'),
      description: apiErrorMessage(e),
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

async function onLocaleChange(value: string) {
  await setLocale(value as AppLocale)
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      {{ t('settings.title') }}
    </h1>

    <UCard>
      <template #header>
        {{ t('settings.language') }}
      </template>
      <USelect
        :model-value="locale"
        :items="localeItems"
        class="w-full"
        @update:model-value="onLocaleChange"
      />
    </UCard>

    <UCard>
      <template #header>
        {{ t('settings.account') }}
      </template>
      <p class="text-sm text-muted">
        {{ user?.email }}
      </p>
      <UButton
        class="mt-3"
        variant="outline"
        color="neutral"
        @click="signOut"
      >
        {{ t('settings.signOut') }}
      </UButton>
    </UCard>

    <UCard>
      <template #header>
        {{ t('settings.homeLocation') }}
      </template>
      <p class="text-sm text-muted mb-3">
        {{ t('settings.homeLocationHint') }}
      </p>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <UFormField :label="t('settings.latitude')">
          <UInput
            v-model.number="homeLat"
            type="number"
            step="any"
          />
        </UFormField>
        <UFormField :label="t('settings.longitude')">
          <UInput
            v-model.number="homeLon"
            type="number"
            step="any"
          />
        </UFormField>
      </div>
      <div class="flex gap-2">
        <UButton
          variant="soft"
          icon="i-lucide-map-pin"
          @click="useGeolocation"
        >
          {{ t('settings.useMyLocation') }}
        </UButton>
        <UButton
          :loading="saving"
          @click="saveLocation"
        >
          {{ t('common.save') }}
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        {{ t('settings.notifications') }}
      </template>
      <p class="text-sm text-muted mb-3">
        {{ t('settings.notificationsHint') }}
      </p>
      <UButton
        :loading="pushLoading"
        :disabled="!config.public.vapidPublicKey"
        icon="i-lucide-bell"
        @click="enablePush"
      >
        {{ t('settings.enablePush') }}
      </UButton>
      <p
        v-if="!config.public.vapidPublicKey"
        class="text-xs text-muted mt-2"
      >
        {{ t('settings.vapidHint') }}
      </p>
    </UCard>
  </div>
</template>
