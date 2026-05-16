<script setup lang="ts">
import type { CareTask } from '#shared/types/database'

const open = defineModel<boolean>('open', { required: true })
const task = defineModel<CareTask | null>('task', { default: null })

const emit = defineEmits<{
  confirm: [soilStillWet: boolean]
}>()

const plantName = computed(() => task.value?.plant?.name ?? 'esta planta')
</script>

<template>
  <UModal v-model:open="open" title="Omitir riego">
    <template #body>
      <p class="text-sm text-muted">
        ¿Omites el riego de <strong>{{ plantName }}</strong> porque la tierra sigue húmeda?
        Si es así, ampliaremos el intervalo entre riegos.
      </p>
      <div class="flex flex-col gap-2 mt-4">
        <UButton block @click="emit('confirm', true)">
          Sí, sigue húmeda
        </UButton>
        <UButton block variant="soft" color="neutral" @click="emit('confirm', false)">
          No, otro motivo
        </UButton>
      </div>
    </template>
  </UModal>
</template>
