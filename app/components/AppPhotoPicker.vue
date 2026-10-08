<script setup lang="ts">
const props = defineProps<{
  preview?: string | null
}>()

const emit = defineEmits<{
  select: [file: File]
}>()

const { t } = useI18n()
const inputRef = ref<HTMLInputElement | null>(null)
const localPreview = ref<string | null>(null)

const shown = computed(() => localPreview.value || props.preview || null)

onUnmounted(() => {
  if (localPreview.value?.startsWith('blob:')) URL.revokeObjectURL(localPreview.value)
})

function openPicker() {
  inputRef.value?.click()
}

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (localPreview.value?.startsWith('blob:')) URL.revokeObjectURL(localPreview.value)
  localPreview.value = URL.createObjectURL(file)
  emit('select', file)
  input.value = ''
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      tabindex="-1"
      aria-hidden="true"
      class="sr-only"
      @change="onChange"
    >
    <button
      type="button"
      class="flex w-full flex-col items-center justify-center gap-2 min-h-32 rounded-2xl border border-dashed border-accented bg-elevated/40 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="openPicker"
    >
      <img
        v-if="shown"
        :src="shown"
        alt=""
        class="w-full max-h-48 aspect-[4/3] object-cover rounded-xl"
      >
      <UIcon
        v-else
        name="i-lucide-camera"
        class="size-7 text-primary"
      />
      <span class="text-sm font-medium text-highlighted">
        {{ shown ? t('common.photoPickerChange') : t('common.photoPicker') }}
      </span>
      <span
        v-if="!shown"
        class="text-xs text-muted"
      >
        {{ t('common.photoPickerHint') }}
      </span>
    </button>
  </div>
</template>
