<script setup lang="ts">
defineProps<{
  title: string
  icon?: string
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon v-if="icon" :name="icon" class="w-4 h-4 text-primary" />
        <span class="font-medium">{{ title }}</span>
      </div>
    </template>
    <slot />
  </UCard>
</template>
