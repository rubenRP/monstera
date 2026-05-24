<script setup lang="ts">
import type { PlantArchiveReason } from '#shared/types/database'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: [reason: PlantArchiveReason]
}>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('plants.archiveTitle')"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ t('plants.archiveDescription') }}
      </p>
      <div class="flex flex-col gap-2 mt-4">
        <UButton
          block
          icon="i-lucide-flower-2"
          @click="emit('confirm', 'died')"
        >
          {{ t('plants.archiveReasonDied') }}
        </UButton>
        <UButton
          block
          variant="soft"
          color="neutral"
          icon="i-lucide-gift"
          @click="emit('confirm', 'gifted')"
        >
          {{ t('plants.archiveReasonGifted') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
