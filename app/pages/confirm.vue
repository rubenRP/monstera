<script setup lang="ts">
definePageMeta({ layout: false })

const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="text-center space-y-3">
      <UIcon name="i-lucide-loader-circle" class="w-10 h-10 animate-spin mx-auto text-primary" />
      <p class="text-muted">Confirmando sesión…</p>
    </div>
  </div>
</template>
