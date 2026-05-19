<script setup lang="ts">
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'

defineProps<{
  title?: string
  items: { label: string, icon?: string, iconTone?: SpeciesDisplayIconTone }[]
}>()

const toneClasses: Record<SpeciesDisplayIconTone, string> = {
  primary: 'bg-primary/20 text-primary',
  blue: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
  amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  red: 'bg-red-500/20 text-red-600 dark:text-red-400',
  neutral: 'bg-neutral-500/20 text-neutral-600 dark:text-neutral-400',
  purple: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  brown: 'bg-amber-800/20 text-amber-800 dark:text-amber-500'
}
</script>

<template>
  <div class="space-y-2">
    <p
      v-if="title"
      class="text-sm font-medium text-muted"
    >
      {{ title }}
    </p>
    <ul class="space-y-2">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="flex items-center gap-3"
      >
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-full"
          :class="toneClasses[item.iconTone ?? 'red']"
        >
          <UIcon
            :name="item.icon ?? 'i-lucide-circle-alert'"
            class="size-4"
          />
        </div>
        <span class="text-sm text-highlighted">{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>
