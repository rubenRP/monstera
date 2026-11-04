<script setup lang="ts">
// The layout depends on auth (app shell when signed in, bare landing otherwise), so it is
// chosen with <NuxtLayout :name> below. `setPageLayout()` from a watcher only works on the
// initial load: on in-app navigation it left signed-in users on the `blank` layout.
definePageMeta({ layout: false })

const user = useAuthUser()
const { isLoaded } = useAuth()
const nuxtApp = useNuxtApp()
const showLanding = useRuntimeConfig().public.showLanding as boolean

const LandingPage = defineAsyncComponent(() =>
  import('~/components/landing/LandingPage.vue')
)

// While hydrating, render the spinner until mounted so hydration always matches.
// On in-app navigation there is nothing to match, so use the auth state right away.
const mounted = ref(!nuxtApp.isHydrating)
onMounted(() => {
  mounted.value = true
})
const authReady = computed(() => mounted.value && isLoaded.value)
const layoutName = computed(() => (authReady.value && user.value ? 'default' : 'blank'))
</script>

<template>
  <NuxtLayout :name="layoutName">
    <div
      v-if="!authReady || (!user && !showLanding)"
      class="min-h-screen flex items-center justify-center bg-default"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 text-primary animate-spin"
      />
    </div>
    <HomeDashboard v-else-if="user" />
    <LandingPage v-else />
  </NuxtLayout>
</template>
