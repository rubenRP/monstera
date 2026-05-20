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

const colorMode = useColorMode()
const logoSrc = computed(() =>
  colorMode.value === 'dark'
    ? '/monstera-logo-mark-dark.svg'
    : '/monstera-logo-mark-light.svg'
)
</script>

<template>
  <img
    :src="logoSrc"
    alt=""
    aria-hidden="true"
    :class="[sizeClass, 'shrink-0']"
  >
</template>
