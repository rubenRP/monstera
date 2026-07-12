<script setup lang="ts">
import { isStandalonePwa } from '~/utils/isStandalonePwa'

definePageMeta({ layout: false })

const { t } = useI18n()
const route = useRoute()
const user = useSupabaseUser()

const inPwa = ref(import.meta.client ? isStandalonePwa() : false)
const safariSession = ref(false)

watchEffect(() => {
  if (!user.value) return
  const openedFromPwaLogin = route.query.from === 'pwa'
  if (inPwa.value || !openedFromPwaLogin) {
    void navigateTo('/')
    return
  }
  safariSession.value = true
})
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-default overflow-hidden">
    <AppBackground variant="hero" />
    <UCard
      v-if="safariSession"
      class="relative w-full max-w-md shadow-xl shadow-primary/5"
    >
      <div class="space-y-3 text-center">
        <UIcon
          name="i-lucide-smartphone"
          class="w-10 h-10 mx-auto text-primary"
        />
        <h1 class="text-lg font-semibold">
          {{ t('auth.safariSessionTitle') }}
        </h1>
        <p class="text-sm text-muted">
          {{ t('auth.safariSessionHint') }}
        </p>
        <UButton
          to="/login"
          block
        >
          {{ t('auth.safariSessionAction') }}
        </UButton>
      </div>
    </UCard>
    <div
      v-else
      class="text-center space-y-3"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-10 h-10 animate-spin mx-auto text-primary"
      />
      <p class="text-muted">
        {{ t('auth.confirmingSession') }}
      </p>
    </div>
  </div>
</template>
