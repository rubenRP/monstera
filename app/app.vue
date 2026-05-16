<script setup lang="ts">
const { t, locale } = useI18n()

useLocalePersistence()

useHead({
  title: () => t('app.title'),
  meta: [
    { name: 'description', content: () => t('app.description') }
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
