<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  title: string
  description?: string
  startMonth: number
  endMonth: number
  label: string
}>()

function segmentStyle(start: number, end: number) {
  const left = ((start - 1) / 12) * 100
  let width: number
  if (end >= start) {
    width = ((end - start + 1) / 12) * 100
  } else {
    width = ((12 - start + 1 + end) / 12) * 100
  }
  return { left: `${left}%`, width: `${Math.min(100 - left, width)}%` }
}

const segment = computed(() => segmentStyle(props.startMonth, props.endMonth))
</script>

<template>
  <div class="space-y-2">
    <p class="font-medium text-highlighted">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="text-sm text-muted"
    >
      {{ description }}
    </p>
    <div class="flex justify-between text-xs text-muted">
      <span>{{ t('species.monthJan') }}</span>
      <span>{{ t('species.monthJun') }}</span>
      <span>{{ t('species.monthDec') }}</span>
    </div>
    <div class="relative h-8 rounded-full bg-elevated overflow-hidden">
      <div
        class="absolute inset-y-1 rounded-full bg-primary/70 flex items-center justify-center min-w-[3rem]"
        :style="segment"
      >
        <span class="text-[10px] font-semibold text-primary-foreground px-2 truncate">
          {{ label }}
        </span>
      </div>
    </div>
  </div>
</template>
