<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const LandingPage = defineAsyncComponent(() =>
  import('~/components/landing/LandingPage.vue')
)

const authReady = ref(false)

function syncLayout() {
  if (!import.meta.client || !authReady.value) return
  setPageLayout(user.value ? 'default' : 'blank')
}

onMounted(async () => {
  await supabase.auth.getSession()
  authReady.value = true
  syncLayout()
})

watch(user, () => {
  syncLayout()
})
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
