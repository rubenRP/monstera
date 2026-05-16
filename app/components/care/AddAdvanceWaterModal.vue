<script setup lang="ts">
import type { Plant } from '#shared/types/database'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  plants: Plant[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [plantId: string]
}>()

const selectedPlantId = ref<string | undefined>(undefined)

const plantItems = computed(() =>
  props.plants.map(p => ({ label: p.name, value: p.id }))
)

watch(open, (isOpen) => {
  if (isOpen) {
    selectedPlantId.value = props.plants[0]?.id
  }
})

watch(() => props.plants, (list) => {
  if (!list.some(p => p.id === selectedPlantId.value)) {
    selectedPlantId.value = list[0]?.id
  }
})

function onSubmit() {
  if (!selectedPlantId.value) return
  emit('submit', selectedPlantId.value)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('care.addAdvanceWaterTitle')"
  >
    <template #body>
      <p class="text-sm text-muted">
        {{ t('care.addAdvanceWaterBody') }}
      </p>

      <UAlert
        v-if="!plants.length"
        class="mt-4"
        color="neutral"
        icon="i-lucide-info"
        :title="t('care.addAdvanceWaterNoPlants')"
      />

      <UFormField
        v-else
        :label="t('care.addAdvanceWaterPlant')"
        class="mt-4"
      >
        <USelect
          v-model="selectedPlantId"
          :items="plantItems"
          class="w-full"
        />
      </UFormField>

      <UButton
        v-if="plants.length"
        class="mt-4"
        block
        icon="i-lucide-droplets"
        :loading="loading"
        :disabled="!selectedPlantId"
        @click="onSubmit"
      >
        {{ t('care.addAdvanceWaterConfirm') }}
      </UButton>
    </template>
  </UModal>
</template>
