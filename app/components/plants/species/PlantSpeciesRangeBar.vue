<script setup lang="ts">
const props = defineProps<{
  label?: string
  min: number
  max: number
  unit: string
  scaleMin: number
  scaleMax: number
}>()

const rangeLabel = computed(() => `${props.min}${props.unit}–${props.max}${props.unit}`)

const leftPct = computed(() => {
  const span = props.scaleMax - props.scaleMin
  if (span <= 0) return 0
  return ((props.min - props.scaleMin) / span) * 100
})

const widthPct = computed(() => {
  const span = props.scaleMax - props.scaleMin
  if (span <= 0) return 100
  return Math.max(8, ((props.max - props.min) / span) * 100)
})

const scaleMarks = computed(() => [
  props.scaleMin,
  Math.round((props.scaleMin + props.scaleMax) / 2),
  props.scaleMax
])
</script>

<template>
  <div class="space-y-2">
    <p
      v-if="label"
      class="text-sm text-muted"
    >
      {{ label }}
    </p>
    <div class="flex justify-between text-xs text-muted px-0.5">
      <span
        v-for="mark in scaleMarks"
        :key="mark"
      >{{ mark }}{{ unit }}</span>
    </div>
    <div class="relative h-3 rounded-full bg-elevated">
      <div
        class="absolute top-1/2 -translate-y-1/2 h-6 min-w-[4rem] rounded-full bg-primary/80 px-2 flex items-center justify-center"
        :style="{ left: `${leftPct}%`, width: `${widthPct}%` }"
      >
        <span class="text-[10px] font-semibold text-primary-foreground whitespace-nowrap">
          {{ rangeLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
