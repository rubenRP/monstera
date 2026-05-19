<script setup lang="ts">
export interface SpeciesNavItem {
  id: string
  label: string
}

defineProps<{
  items: SpeciesNavItem[]
  activeId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div class="sticky top-0 z-10 -mx-1 bg-default/95 backdrop-blur py-2">
    <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :class="item.id === activeId
          ? 'bg-primary text-primary-foreground'
          : 'border border-primary/40 text-primary'"
        @click="emit('select', item.id)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
