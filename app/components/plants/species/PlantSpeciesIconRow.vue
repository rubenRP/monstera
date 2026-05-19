<script setup lang="ts">
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'

const props = defineProps<{
  icon: string
  iconTone?: SpeciesDisplayIconTone
  label: string
  sublabel?: string
  badge?: string
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

const iconBg = computed(() => toneClasses[props.iconTone ?? 'neutral'])
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="flex size-11 shrink-0 items-center justify-center rounded-full"
      :class="iconBg"
    >
      <UIcon
        :name="icon"
        class="size-5"
      />
    </div>
    <div class="min-w-0 flex-1">
      <p class="font-medium text-highlighted">
        {{ label }}
      </p>
      <p
        v-if="sublabel"
        class="text-sm text-muted"
      >
        {{ sublabel }}
      </p>
    </div>
    <span
      v-if="badge"
      class="shrink-0 rounded-full bg-sky-500/20 px-2.5 py-1 text-sm font-semibold text-sky-700 dark:text-sky-300"
    >
      {{ badge }}
    </span>
  </div>
</template>
