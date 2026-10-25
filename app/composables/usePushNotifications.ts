import { isStandalonePwa } from '~/utils/isStandalonePwa'
import { exportPushSubscription } from '~/utils/push/exportSubscription'

export type PushStatus = 'unsupported' | 'needs-install' | 'denied' | 'enabled' | 'disabled'

export function isIosDevice(): boolean {
  if (!import.meta.client) return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function usePushNotifications() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient()
  const { t } = useI18n()
  const { localeHeaders } = useI18nHeaders()

  function pushSupported() {
    return import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error(t('settings.pushSessionExpired'))
    return { Authorization: `Bearer ${token}` }
  }

  async function currentSubscription(): Promise<PushSubscription | null> {
    if (!pushSupported()) return null
    const reg = await navigator.serviceWorker.getRegistration()
    return (await reg?.pushManager.getSubscription()) ?? null
  }

  /** What the settings card should show for this device. */
  async function status(): Promise<PushStatus> {
    if (isIosDevice() && !isStandalonePwa()) return 'needs-install'
    if (!pushSupported()) return 'unsupported'
    if (Notification.permission === 'denied') return 'denied'
    if (Notification.permission !== 'granted') return 'disabled'
    return (await currentSubscription()) ? 'enabled' : 'disabled'
  }

  async function unsubscribe() {
    const sub = await currentSubscription()
    if (!sub) return
    await $fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: await authHeaders(),
      body: { endpoint: sub.endpoint }
    })
    await sub.unsubscribe()
  }

  async function sendTest() {
    await $fetch('/api/push/test', {
      method: 'POST',
      headers: { ...(await authHeaders()), ...localeHeaders() }
    })
  }

  async function subscribe() {
    if (!pushSupported()) {
      throw new Error(t('settings.pushNotSupported'))
    }

    if (isIosDevice() && !isStandalonePwa()) {
      throw new Error(t('settings.pushRequiresPwa'))
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error(t('settings.pushDenied'))
    }

    const reg = await navigator.serviceWorker.ready

    const vapidKey = config.public.vapidPublicKey
    if (!vapidKey) {
      throw new Error(t('settings.vapidHint'))
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    })

    const payload = exportPushSubscription(sub)

    await $fetch('/api/push/subscribe', {
      method: 'POST',
      headers: await authHeaders(),
      body: payload
    })

    return sub
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  return { subscribe, unsubscribe, sendTest, status }
}
