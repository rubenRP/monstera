<script setup lang="ts">
import { plantAvatarTint, plantInitials } from '#shared/utils/plants/avatar'

const props = withDefaults(defineProps<{
  name: string
  photoSrc?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  photoSrc: null,
  size: 'md'
})

/** Static classes so Tailwind keeps them; index = plantAvatarTint(name). */
const PLANT_AVATAR_TINTS = [
  'bg-green-600/15 text-green-700 dark:text-green-300 ring-green-600/20',
  'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20',
  'bg-teal-600/15 text-teal-700 dark:text-teal-300 ring-teal-600/20',
  'bg-lime-600/15 text-lime-700 dark:text-lime-300 ring-lime-600/20',
  'bg-amber-600/15 text-amber-700 dark:text-amber-300 ring-amber-600/20',
  'bg-cyan-600/15 text-cyan-700 dark:text-cyan-300 ring-cyan-600/20'
]

const SIZE_CLASSES = {
  sm: 'size-9 rounded-lg text-xs',
  md: 'size-12 rounded-xl text-sm',
  lg: 'size-16 rounded-2xl text-lg',
  xl: 'size-24 rounded-3xl text-2xl'
} as const

const failed = ref(false)
watch(() => props.photoSrc, () => {
  failed.value = false
})

const initials = computed(() => plantInitials(props.name))
const tint = computed(() => PLANT_AVATAR_TINTS[plantAvatarTint(props.name)])
</script>

<template>
  <img
    v-if="photoSrc && !failed"
    :src="photoSrc"
    alt=""
    loading="lazy"
    class="object-cover shrink-0 ring-1 ring-inset ring-default"
    :class="SIZE_CLASSES[size]"
    @error="failed = true"
  >
  <span
    v-else
    aria-hidden="true"
    class="flex items-center justify-center shrink-0 font-semibold tracking-wide ring-1 ring-inset select-none"
    :class="[SIZE_CLASSES[size], tint]"
  >
    {{ initials }}
  </span>
</template>
