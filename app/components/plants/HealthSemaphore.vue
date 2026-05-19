<script setup lang="ts">
import type { HealthStatus } from '#shared/types/database'
import {
  HEALTH_ICONS,
  HEALTH_ICON_CLASSES,
  HEALTH_ICON_SELECTED_CLASSES,
  HEALTH_SELECTED_CLASSES
} from '#shared/constants/plants'

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

const iconSize = computed(() => (props.compact ? 'size-9' : 'size-11'))
const iconGlyph = computed(() => (props.compact ? 'size-4' : 'size-5'))
</script>

<template>
  <motion.div
    class="space-y-3"
  >
    <div
      class="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-elevated/40 border border-default"
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
        class="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-all"
        :class="[
          modelValue === opt.value
            ? HEALTH_SELECTED_CLASSES[opt.value]
            : 'text-muted hover:bg-elevated/60',
          readonly ? 'cursor-default' : 'cursor-pointer'
        ]"
        @click="!readonly && emit('update:modelValue', opt.value)"
      >
        <div
          class="flex shrink-0 items-center justify-center rounded-full transition-all"
          :class="[
            iconSize,
            modelValue === opt.value
              ? HEALTH_ICON_SELECTED_CLASSES[opt.value]
              : HEALTH_ICON_CLASSES[opt.value]
          ]"
        >
          <UIcon
            :name="HEALTH_ICONS[opt.value]"
            :class="iconGlyph"
          />
        </div>
        <span
          class="font-medium leading-tight text-center"
          :class="[
            compact ? 'text-[10px]' : 'text-xs',
            modelValue === opt.value ? 'text-highlighted' : 'text-muted'
          ]"
        >
          {{ opt.label }}
        </span>
      </button>
    </div>

    <UInput
      v-if="showNote && !readonly"
      v-model="note"
      :placeholder="t('plants.healthNotePlaceholder')"
      size="sm"
    />
  </motion.div>
</template>
