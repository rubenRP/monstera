<script setup lang="ts">
import type { AppLocale, IndoorHumidityLevel } from '#shared/types/database'

const { t, locales, locale, setLocale } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { requireUserId } = useRequireUserId()
const config = useRuntimeConfig()
const toast = useToast()
const { apiErrorMessage } = useApiError()
const { subscribe } = usePushNotifications()

const homeLat = ref(String(config.public.homeLat))
const homeLon = ref(String(config.public.homeLon))
const indoorHumidity = ref<IndoorHumidityLevel>('auto')
const saving = ref(false)
const pushLoading = ref(false)
const recalcLoading = ref(false)
const recalcAllLoading = ref(false)

const localeItems = computed(() =>
  locales.value.map(l => ({ label: l.name, value: l.code }))
)

onMounted(async () => {
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    return
  }
  const { data } = await supabase
    .from('user_settings')
    .select('home_lat, home_lon, locale, indoor_humidity')
    .eq('user_id', userId)
    .maybeSingle()
  if (data?.home_lat != null) homeLat.value = String(data.home_lat)
  if (data?.home_lon != null) homeLon.value = String(data.home_lon)
  if (data?.indoor_humidity) indoorHumidity.value = data.indoor_humidity
})

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return n
}

const indoorHumidityItems = computed(() => [
  { label: t('settings.indoorHumidityAuto'), value: 'auto' },
  { label: t('plants.humidityLow'), value: 'low' },
  { label: t('plants.humidityNormal'), value: 'normal' },
  { label: t('plants.humidityHigh'), value: 'high' }
])

async function triggerHomeSettingsRecalc() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return

  const result = await $fetch<{
    updated: number
    errors: number
    plants: number
    skipped: number
  }>(
    '/api/watering/recalculate-all',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { source: 'home_settings_update' }
    }
  )

  if (result.plants === 0) return

  toast.add({
    title: t('settings.wateringRecalcAllDone', { count: result.updated }),
    description: buildRecalcToastDescription(result.errors, result.skipped),
    color: result.errors ? 'warning' : 'success'
  })
}

async function saveHomeSettings() {
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    toast.add({ title: t('auth.notAuthenticated'), color: 'error' })
    return
  }

  const lat = parseCoordinate(homeLat.value)
  const lon = parseCoordinate(homeLon.value)
  if (lat == null || lon == null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    toast.add({ title: t('settings.coordsInvalid'), color: 'error' })
    return
  }

  saving.value = true
  try {
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      home_lat: lat,
      home_lon: lon,
      indoor_humidity: indoorHumidity.value,
      locale: locale.value as AppLocale,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) throw error

    homeLat.value = String(lat)
    homeLon.value = String(lon)
    toast.add({ title: t('settings.locationSaved'), color: 'success' })
    await triggerHomeSettingsRecalc()
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

async function recalculateAllWatering() {
  recalcAllLoading.value = true
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error(t('auth.notAuthenticated'))

    const result = await $fetch<{
      updated: number
      errors: number
      plants: number
      skipped: number
    }>(
      '/api/watering/recalculate-all',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (result.plants === 0) {
      toast.add({ title: t('settings.wateringRecalcAllEmpty'), color: 'neutral' })
      return
    }

    toast.add({
      title: t('settings.wateringRecalcAllDone', { count: result.updated }),
      description: buildRecalcToastDescription(result.errors, result.skipped),
      color: result.errors ? 'warning' : 'success'
    })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    recalcAllLoading.value = false
  }
}

function buildRecalcToastDescription(errors: number, skipped: number): string | undefined {
  const parts: string[] = []
  if (errors) parts.push(t('settings.wateringRecalcErrors', { count: errors }))
  if (skipped) parts.push(t('settings.wateringRecalcSkipped', { count: skipped }))
  return parts.length ? parts.join(' ') : undefined
}

async function recalculateExteriorWatering() {
  recalcLoading.value = true
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error(t('auth.notAuthenticated'))

    const result = await $fetch<{ updated: number, errors: number, plants: number }>(
      '/api/watering/recalculate-exterior',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (result.plants === 0) {
      toast.add({ title: t('settings.wateringRecalcEmpty'), color: 'neutral' })
      return
    }

    toast.add({
      title: t('settings.wateringRecalcDone', { count: result.updated }),
      description: buildRecalcToastDescription(result.errors, 0),
      color: result.errors ? 'warning' : 'success'
    })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    recalcLoading.value = false
  }
}

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}

function useGeolocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition((pos) => {
    homeLat.value = String(pos.coords.latitude)
    homeLon.value = String(pos.coords.longitude)
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
            v-model="homeLat"
            type="text"
            inputmode="decimal"
            placeholder="40.4168"
          />
        </UFormField>
        <UFormField :label="t('settings.longitude')">
          <UInput
            v-model="homeLon"
            type="text"
            inputmode="decimal"
            placeholder="-3.7038"
          />
        </UFormField>
      </div>
      <UFormField
        class="mb-3"
        :label="t('settings.indoorHumidity')"
        :description="t('settings.indoorHumidityHint')"
      >
        <USelect
          v-model="indoorHumidity"
          :items="indoorHumidityItems"
          class="w-full"
        />
      </UFormField>
      <div class="flex gap-2">
        <UButton
          variant="soft"
          icon="i-lucide-map-pin"
          @click="useGeolocation"
        >
          {{ t('settings.useMyLocation') }}
        </UButton>
        <UButton
          type="button"
          :loading="saving"
          @click="saveHomeSettings"
        >
          {{ t('common.save') }}
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        {{ t('settings.wateringRecalcSectionTitle') }}
      </template>
      <div class="space-y-4">
        <div>
          <p class="text-sm text-muted mb-3">
            {{ t('settings.wateringRecalcAllHint') }}
          </p>
          <UButton
            :loading="recalcAllLoading"
            icon="i-lucide-refresh-ccw"
            @click="recalculateAllWatering"
          >
            {{ t('settings.wateringRecalcAllAction') }}
          </UButton>
        </div>
        <div class="border-t border-default pt-4">
          <p class="text-sm text-muted mb-3">
            {{ t('settings.wateringRecalcHint') }}
          </p>
          <UButton
            :loading="recalcLoading"
            variant="soft"
            icon="i-lucide-sun"
            @click="recalculateExteriorWatering"
          >
            {{ t('settings.wateringRecalcAction') }}
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        {{ t('settings.notifications') }}
      </template>
      <p class="text-sm text-muted mb-3">
        {{ t('settings.notificationsHint') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          :loading="pushLoading"
          :disabled="!config.public.vapidPublicKey"
          icon="i-lucide-bell"
          @click="enablePush"
        >
          {{ t('settings.enablePush') }}
        </UButton>
      </div>
      <p
        v-if="!config.public.vapidPublicKey"
        class="text-xs text-muted mt-2"
      >
        {{ t('settings.vapidHint') }}
      </p>
    </UCard>
  </div>
</template>
