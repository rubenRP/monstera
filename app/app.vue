<script setup lang="ts">
const { t, locale } = useI18n()
const colorMode = useColorMode()

useLocalePersistence()

const themeColor = computed(() =>
  colorMode.value === 'dark' ? '#1A2D1A' : '#F5F0E4'
)

const statusBarStyle = computed(() =>
  colorMode.value === 'dark' ? 'black-translucent' : 'default'
)

useHead({
  title: () => t('app.title'),
  meta: [
    { name: 'description', content: () => t('app.description') },
    { name: 'theme-color', content: themeColor },
    { name: 'apple-mobile-web-app-status-bar-style', content: statusBarStyle },
    { name: 'apple-mobile-web-app-capable', content: 'yes' }
  ],
  htmlAttrs: {
    lang: () => locale.value
  }
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
