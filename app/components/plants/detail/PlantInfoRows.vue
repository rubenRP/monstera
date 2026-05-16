<script setup lang="ts">
export interface InfoRow {
  label: string
  value: string
}

defineProps<{
  rows: InfoRow[]
}>()
</script>

<template>
  <dl class="space-y-2.5 text-sm">
    <div
      v-for="(row, i) in rows"
      :key="i"
      class="flex flex-col gap-0.5 sm:flex-row sm:gap-4"
    >
      <dt class="text-muted shrink-0 sm:w-36">
        {{ row.label }}
      </dt>
      <dd class="text-default whitespace-pre-wrap">
        {{ row.value }}
      </dd>
    </div>
  </dl>
</template>
