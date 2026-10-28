<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  confirmLabel: string
  confirmColor?: 'error' | 'primary' | 'warning'
  confirmIcon?: string
  loading?: boolean
}>(), {
  description: undefined,
  confirmColor: 'error',
  confirmIcon: 'i-lucide-trash-2',
  loading: false
})

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: []
}>()

const { t } = useI18n()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="!loading"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="open = false"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          :color="confirmColor"
          :icon="confirmIcon"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
