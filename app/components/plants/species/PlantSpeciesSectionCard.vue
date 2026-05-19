<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated/50 p-4 space-y-4">
    <h3
      v-if="title"
      class="text-lg font-semibold text-highlighted"
    >
      {{ title }}
    </h3>
    <slot />
  </div>
</template>
