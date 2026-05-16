<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'

const { t } = useI18n()
const { healthOptions } = usePlantEnumLabels()

const props = withDefaults(
  defineProps<{
    modelValue: HealthStatus
    compact?: boolean
    readonly?: boolean
  }>(),
  { compact: false, readonly: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: HealthStatus]
}>()

const showNote = computed(
  () => props.modelValue === 'fair' || props.modelValue === 'sick' || props.modelValue === 'critical'
)

const note = defineModel<string>('note', { default: '' })
</script>

<template>
  <div class="space-y-3">
    <div
      class="flex gap-1 p-1 rounded-xl bg-elevated/50"
      :class="compact ? 'text-xs' : 'text-sm'"
      role="radiogroup"
      :aria-label="t('plants.healthAria')"
    >
      <button
        v-for="opt in healthOptions"
        :key="opt.value"
        type="button"
        role="radio"
        :aria-checked="modelValue === opt.value"
        :aria-label="t('plants.healthStatusAria', { label: opt.label })"
        :disabled="readonly"
        class="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all"
        :class="[
          modelValue === opt.value
            ? `${opt.color} text-white shadow-sm`
            : 'text-muted hover:bg-elevated',
          readonly ? 'cursor-default' : 'cursor-pointer'
        ]"
        @click="!readonly && emit('update:modelValue', opt.value)"
      >
        <span
          class="w-3 h-3 rounded-full shrink-0"
          :class="modelValue === opt.value ? 'bg-white/90' : opt.color"
        />
        <span class="font-medium leading-tight text-center">{{ opt.label }}</span>
      </button>
    </div>

    <UInput
      v-if="showNote && !readonly"
      v-model="note"
      :placeholder="t('plants.healthNotePlaceholder')"
      size="sm"
    />
  </div>
</template>
