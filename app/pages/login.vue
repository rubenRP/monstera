<script setup lang="ts">
import { enUS, esES } from '@clerk/localizations'

definePageMeta({ layout: false })

const { t, locale } = useI18n()
const colorMode = useColorMode()
const { isLoaded, isSignedIn } = useAuth()
usePageTitle(() => t('auth.loginTitle'))

const appearance = computed(() => {
  const dark = colorMode.value === 'dark'
  return {
    variables: {
      colorPrimary: '#16a34a',
      borderRadius: '0.5rem',
      ...(dark
        ? {
            colorBackground: '#222326',
            colorText: '#f4f4f5',
            colorTextSecondary: '#a1a1aa',
            colorInputBackground: '#18191B',
            colorInputText: '#f4f4f5',
            colorNeutral: '#f4f4f5'
          }
        : {})
    },
    elements: {
      rootBox: 'w-full',
      cardBox: 'w-full shadow-xl shadow-primary/5'
    }
  }
})

// Keep Clerk's own UI texts in the app language (needs the Clerk instance, so client + loaded only).
watch([isLoaded, locale], ([loaded, current]) => {
  if (!import.meta.client || !loaded) return
  updateClerkOptions({ localization: current === 'en' ? enUS : esES })
}, { immediate: true })

// Already signed in (e.g. opened /login again): go straight to the app.
watch([isLoaded, isSignedIn], ([loaded, signedIn]) => {
  if (loaded && signedIn) void navigateTo('/')
}, { immediate: true })
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-default overflow-hidden">
    <AppBackground variant="hero" />
    <div class="relative w-full max-w-md space-y-6">
      <div class="flex items-center justify-center gap-2">
        <AppLogo size="lg" />
        <div>
          <h1 class="text-xl font-bold">
            {{ t('app.title') }}
          </h1>
          <p class="text-sm text-muted">
            {{ t('auth.loginSubtitle') }}
          </p>
        </div>
      </div>

      <ClientOnly>
        <SignIn
          routing="hash"
          :appearance="appearance"
        />
        <template #fallback>
          <div class="flex justify-center py-10">
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 text-primary animate-spin"
            />
          </div>
        </template>
      </ClientOnly>

      <div class="text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          {{ t('auth.backToLanding') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
