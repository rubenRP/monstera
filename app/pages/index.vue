<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const user = useAuthUser()
const { isLoaded } = useAuth()

const LandingPage = defineAsyncComponent(() =>
  import('~/components/landing/LandingPage.vue')
)

// Render the spinner on the server and until mounted, so hydration always matches.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const authReady = computed(() => mounted.value && isLoaded.value)

function syncLayout() {
  if (!authReady.value) return
  setPageLayout(user.value ? 'default' : 'blank')
}

watch([authReady, user], syncLayout, { immediate: true })
</script>

<template>
  <div
    v-if="!authReady"
    class="min-h-screen flex items-center justify-center bg-default"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="w-8 h-8 text-primary animate-spin"
    />
  </div>
  <HomeDashboard v-else-if="user" />
  <LandingPage v-else />
</template>
