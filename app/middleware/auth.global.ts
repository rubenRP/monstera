/**
 * Redirects signed-out users to /login. /login is always public; the landing page `/` is public
 * unless `NUXT_PUBLIC_SHOW_LANDING=false`, in which case signed-out visitors go to /login too.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const showLanding = useRuntimeConfig().public.showLanding
  if (to.path === '/login' || (to.path === '/' && showLanding)) return

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
