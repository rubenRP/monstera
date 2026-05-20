<script setup lang="ts">
import type { AppLocale } from '#shared/types/database'
import {
  getBrowserTimezone,
  reminderTimeFromInput,
  reminderTimeToInputValue
} from '#shared/utils/push/reminderSchedule'

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
const saving = ref(false)
const pushLoading = ref(false)
const savingReminder = ref(false)
const pushReminderTime = ref('09:00')
const pushReminderTimezone = ref(getBrowserTimezone())
const recalcLoading = ref(false)

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
    .select('home_lat, home_lon, locale, push_reminder_time, push_reminder_timezone')
    .eq('user_id', userId)
    .maybeSingle()
  if (data?.home_lat != null) homeLat.value = String(data.home_lat)
  if (data?.home_lon != null) homeLon.value = String(data.home_lon)
  if (data?.push_reminder_time) {
    pushReminderTime.value = reminderTimeToInputValue(data.push_reminder_time)
  }
  if (data?.push_reminder_timezone) {
    pushReminderTimezone.value = data.push_reminder_timezone
  }
})

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return n
}

async function saveLocation() {
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
      locale: locale.value as AppLocale,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) throw error

    homeLat.value = String(lat)
    homeLon.value = String(lon)
    toast.add({ title: t('settings.locationSaved'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function savePushReminder() {
  let userId: string
  try {
    userId = await requireUserId()
  } catch {
    toast.add({ title: t('auth.notAuthenticated'), color: 'error' })
    return
  }
  savingReminder.value = true
  pushReminderTimezone.value = getBrowserTimezone()
  try {
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      push_reminder_time: reminderTimeFromInput(pushReminderTime.value),
      push_reminder_timezone: pushReminderTimezone.value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) throw error
    toast.add({ title: t('settings.pushReminderSaved'), color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: t('common.error'), description: apiErrorMessage(e), color: 'error' })
  } finally {
    savingReminder.value = false
  }
}

async function enablePush() {
  pushLoading.value = true
  try {
    await subscribe()
    const userId = await requireUserId()
    pushReminderTimezone.value = getBrowserTimezone()
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      push_reminder_time: reminderTimeFromInput(pushReminderTime.value),
      push_reminder_timezone: pushReminderTimezone.value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    if (error) throw error
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
      description: result.errors
        ? t('settings.wateringRecalcErrors', { count: result.errors })
        : undefined,
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
          @click="saveLocation"
        >
          {{ t('common.save') }}
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        {{ t('settings.wateringRecalcTitle') }}
      </template>
      <p class="text-sm text-muted mb-3">
        {{ t('settings.wateringRecalcHint') }}
      </p>
      <UButton
        :loading="recalcLoading"
        icon="i-lucide-refresh-ccw"
        @click="recalculateExteriorWatering"
      >
        {{ t('settings.wateringRecalcAction') }}
      </UButton>
    </UCard>

    <UCard>
      <template #header>
        {{ t('settings.notifications') }}
      </template>
      <p class="text-sm text-muted mb-3">
        {{ t('settings.notificationsHint') }}
      </p>
      <UFormField
        :label="t('settings.pushReminderTime')"
        class="mb-3"
      >
        <UInput
          v-model="pushReminderTime"
          type="time"
          class="w-full"
        />
      </UFormField>
      <p class="text-xs text-muted mb-3">
        {{ t('settings.pushReminderTimezone', { tz: pushReminderTimezone }) }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          :loading="savingReminder"
          variant="soft"
          icon="i-lucide-clock"
          @click="savePushReminder"
        >
          {{ t('settings.savePushReminder') }}
        </UButton>
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
