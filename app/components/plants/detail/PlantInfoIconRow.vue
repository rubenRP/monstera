<script setup lang="ts">
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'

const props = defineProps<{
  icon: string
  iconTone?: SpeciesDisplayIconTone
  label: string
  sublabel: string
  missing?: boolean
  editTo?: string
  editLabel?: string
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

const iconBg = computed(() => {
  if (props.missing) return 'bg-red-500/15 text-red-500 dark:text-red-400'
  return toneClasses[props.iconTone ?? 'neutral']
})
</script>

<template>
  <div class="flex items-start gap-3 min-w-0">
    <div
      class="relative flex size-11 shrink-0 items-center justify-center rounded-full"
      :class="iconBg"
    >
      <UIcon
        :name="icon"
        class="size-5"
      />
      <span
        v-if="missing"
        class="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-elevated"
      />
    </div>
    <div class="min-w-0 flex-1 pt-0.5">
      <p
        class="font-semibold leading-tight"
        :class="missing ? 'text-red-600 dark:text-red-400' : 'text-highlighted'"
      >
        {{ label }}
      </p>
      <p class="text-sm text-muted mt-0.5">
        {{ sublabel }}
      </p>
      <NuxtLink
        v-if="missing && editTo"
        :to="editTo"
        class="text-xs text-primary underline mt-1 inline-block"
      >
        {{ editLabel }}
      </NuxtLink>
    </div>
  </div>
</template>
