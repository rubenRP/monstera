<script setup lang="ts">
import { isStandalonePwa } from '~/utils/isStandalonePwa'

definePageMeta({ layout: false })

const { t } = useI18n()
const user = useSupabaseUser()

const inPwa = ref(false)
const safariSession = ref(false)

onMounted(() => {
  inPwa.value = isStandalonePwa()
})

watchEffect(() => {
  if (!user.value) return
  if (inPwa.value) {
    navigateTo('/')
    return
  }
  safariSession.value = true
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard
      v-if="safariSession"
      class="w-full max-w-md"
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
