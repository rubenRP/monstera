<script setup lang="ts">
import type { SpeciesDisplayIconTone } from '#shared/types/speciesDisplay'

export interface PlantInfoGridItem {
  icon: string
  iconTone?: SpeciesDisplayIconTone
  label: string
  sublabel: string
  missing?: boolean
  editTo?: string
  editLabel?: string
}

const props = withDefaults(defineProps<{
  title: string
  items: PlantInfoGridItem[]
  /** Sections start collapsed so care actions stay near the top of the page. */
  defaultOpen?: boolean
}>(), {
  defaultOpen: false
})

const { t } = useI18n()
const open = ref(props.defaultOpen)
const missingCount = computed(() => props.items.filter(item => item.missing).length)
/** One-line preview shown while collapsed, e.g. "Medium · East · 100 cm". */
const preview = computed(() =>
  props.items
    .filter(item => !item.missing)
    .slice(0, 3)
    .map(item => item.label)
    .join(' · ')
)
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated/50">
    <UCollapsible v-model:open="open">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-primary"
        :aria-expanded="open"
      >
        <span class="min-w-0 flex-1">
          <span class="block font-semibold text-highlighted">{{ title }}</span>
          <span
            v-if="!open && preview"
            class="block truncate text-xs text-muted"
          >{{ preview }}</span>
        </span>
        <span
          v-if="missingCount"
          class="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning"
        >
          {{ t('plants.missingCount', { count: missingCount }) }}
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 shrink-0 text-muted transition-transform duration-200"
          :class="open ? 'rotate-180' : ''"
        />
      </button>

      <template #content>
        <div class="space-y-4 px-4 pb-5 pt-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <PlantsDetailPlantInfoIconRow
              v-for="(item, i) in items"
              :key="i"
              :icon="item.icon"
              :icon-tone="item.iconTone"
              :label="item.label"
              :sublabel="item.sublabel"
              :missing="item.missing"
              :edit-to="item.editTo"
              :edit-label="item.editLabel"
            />
          </div>
          <slot />
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
