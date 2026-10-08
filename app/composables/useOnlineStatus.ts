export function useOnlineStatus() {
  const online = ref(true)

  if (import.meta.client) {
    online.value = navigator.onLine

    const setOnline = () => {
      online.value = true
    }
    const setOffline = () => {
      online.value = false
    }

    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)
    onScopeDispose(() => {
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
    })
  }

  return { online }
}
