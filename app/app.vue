<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#2d6a4f' }
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'es' }
})

useSeoMeta({
  title: 'Monstera',
  description: 'Cuidado de plantas de casa — riego, diagnóstico y recomendaciones',
  ogTitle: 'Monstera',
  ogDescription: 'Cuidado de plantas de casa'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
