<script setup lang="ts">
import type { CareTask } from '#shared/types/database'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })
const task = defineModel<CareTask | null>('task', { default: null })

const emit = defineEmits<{
  confirm: [soilStillWet: boolean]
}>()

const plantName = computed(() => task.value?.plant?.name ?? t('care.thisPlant'))
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('care.skipWaterTitle')"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ t('care.skipWaterBody', { plant: plantName }) }}
      </p>
      <div class="flex flex-col gap-2 mt-4">
        <UButton
          block
          @click="emit('confirm', true)"
        >
          {{ t('care.skipWaterWet') }}
        </UButton>
        <UButton
          block
          variant="soft"
          color="neutral"
          @click="emit('confirm', false)"
        >
          {{ t('care.skipWaterOther') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
