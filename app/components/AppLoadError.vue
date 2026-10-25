<script setup lang="ts">
defineProps<{
  description?: string
  retrying?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    icon="i-lucide-cloud-off"
    :title="t('common.loadErrorTitle')"
    :description="description || t('common.loadErrorDescription')"
  >
    <template #actions>
      <UButton
        size="sm"
        color="error"
        variant="outline"
        icon="i-lucide-refresh-cw"
        :loading="retrying"
        @click="emit('retry')"
      >
        {{ t('common.retry') }}
      </UButton>
    </template>
  </UAlert>
</template>
