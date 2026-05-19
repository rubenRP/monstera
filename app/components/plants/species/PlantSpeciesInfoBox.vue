<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  text: string
}>()
</script>

<template>
  <div class="rounded-xl bg-elevated/80 p-3 space-y-1">
    <p class="text-xs font-medium text-muted">
      {{ t('species.infoLabel') }}
    </p>
    <p class="text-sm text-toned whitespace-pre-wrap">
      {{ text }}
    </p>
  </div>
</template>
