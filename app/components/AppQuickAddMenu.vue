<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  side?: 'top' | 'bottom' | 'right'
}>()

const { t } = useI18n()

const items = computed<DropdownMenuItem[][]>(() => [[
  { label: t('quickAdd.newPlant'), icon: 'i-lucide-sprout', to: '/plants/new' },
  { label: t('quickAdd.advanceWater'), icon: 'i-lucide-droplets', to: { path: '/', query: { action: 'advance-water' } } },
  { label: t('quickAdd.newSite'), icon: 'i-lucide-map-pin-plus', to: '/sites/new' }
]])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side: side ?? 'top', align: 'center', sideOffset: 10 }"
  >
    <slot />
  </UDropdownMenu>
</template>
