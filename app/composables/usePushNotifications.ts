import { isStandalonePwa } from '~/utils/isStandalonePwa'
import { exportPushSubscription } from '~/utils/push/exportSubscription'

export function usePushNotifications() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient()
  const { t } = useI18n()

  async function subscribe() {
    if (!import.meta.client || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error(t('settings.pushNotSupported'))
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (isIos && !isStandalonePwa()) {
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

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      throw new Error(t('settings.pushSessionExpired'))
    }

    await $fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
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

  return { subscribe }
}
