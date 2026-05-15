<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'
import { HEALTH_STATUS_OPTIONS } from '#shared/constants/plants'

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

const note = defineModel<string | null>('note', { default: null })
</script>

<template>
  <div class="space-y-3">
    <div
      class="flex gap-1 p-1 rounded-xl bg-elevated/50"
      :class="compact ? 'text-xs' : 'text-sm'"
      role="radiogroup"
      aria-label="Estado de salud de la planta"
    >
      <button
        v-for="opt in HEALTH_STATUS_OPTIONS"
        :key="opt.value"
        type="button"
        role="radio"
        :aria-checked="modelValue === opt.value"
        :aria-label="`Estado: ${opt.label}`"
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
      placeholder="Motivo del estado (opcional)"
      size="sm"
    />
  </div>
</template>
