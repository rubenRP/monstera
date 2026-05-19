<script setup lang="ts">
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'

defineProps<{
  items: { label: string, tone?: SpeciesDisplayIconTone }[]
}>()

const toneClasses: Record<SpeciesDisplayIconTone, string> = {
  primary: 'bg-primary/25 text-primary',
  blue: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
  amber: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
  red: 'bg-red-500/20 text-red-700 dark:text-red-300',
  neutral: 'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300',
  purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  brown: 'bg-amber-900/30 text-amber-800 dark:text-amber-400'
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="(item, i) in items"
      :key="i"
      class="rounded-full px-3 py-1 text-sm font-medium"
      :class="toneClasses[item.tone ?? 'primary']"
    >
      {{ item.label }}
    </span>
  </div>
</template>
