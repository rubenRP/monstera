export function usePushNotifications() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient()

  async function subscribe() {
    if (!import.meta.client || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push no soportado en este navegador')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado')
    }

    const reg = await navigator.serviceWorker.ready
    const vapidKey = config.public.vapidPublicKey
    if (!vapidKey) {
      throw new Error('VAPID public key no configurada')
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    })

    const json = sub.toJSON()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    await $fetch('/api/push/subscribe', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        endpoint: json.endpoint,
        keys: json.keys
      }
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
