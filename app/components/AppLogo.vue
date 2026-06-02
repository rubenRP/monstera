<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-5 h-5'
    case 'lg': return 'w-8 h-8'
    default: return 'w-6 h-6'
  }
})

</script>

<template>
  <img
    src="/monstera-logo-mark-light.svg"
    alt=""
    aria-hidden="true"
    :class="[sizeClass, 'shrink-0 dark:hidden']"
  >
  <img
    src="/monstera-logo-mark-dark.svg"
    alt=""
    aria-hidden="true"
    :class="[sizeClass, 'hidden shrink-0 dark:block']"
  >
</template>
