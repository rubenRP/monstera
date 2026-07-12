<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'ambient' | 'hero'
}>(), {
  variant: 'ambient'
})
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
  >
    <div
      class="absolute -top-40 -left-32 rounded-full bg-primary/20 blur-3xl"
      :class="variant === 'hero' ? 'h-96 w-96' : 'h-80 w-80'"
    />
    <div
      class="absolute -top-24 right-0 rounded-full bg-emerald-400/15 blur-3xl"
      :class="variant === 'hero' ? 'h-80 w-80' : 'h-72 w-72'"
    />
    <div class="absolute bottom-[-6rem] -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
    <div
      class="absolute inset-0 opacity-40 dark:opacity-[0.12]"
      style="background-image: radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--ui-primary) 35%, transparent) 1px, transparent 0); background-size: 32px 32px; mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%); -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%);"
    />
  </div>
</template>
