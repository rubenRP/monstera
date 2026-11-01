const PUBLIC_PATHS = ['/', '/login']

/** Redirects signed-out users to /login (the landing page `/` and /login stay public). */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (PUBLIC_PATHS.includes(to.path)) return

  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(isLoaded, (loaded) => {
        if (!loaded) return
        stop()
        resolve()
      })
    })
  }
  if (!isSignedIn.value) return navigateTo('/login')
})
