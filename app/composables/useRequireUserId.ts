export function isValidUserId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id !== 'undefined'
}

export function useRequireUserId() {
  const { userId, isLoaded } = useAuth()

  async function requireUserId(): Promise<string> {
    if (!isLoaded.value) {
      await new Promise<void>((resolve) => {
        const stop = watch(isLoaded, (loaded) => {
          if (!loaded) return
          stop()
          resolve()
        }, { immediate: true })
      })
    }
    const uid = userId.value
    if (!isValidUserId(uid)) {
      throw new Error('No autenticado')
    }
    return uid
  }

  return { requireUserId }
}
