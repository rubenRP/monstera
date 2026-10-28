<script setup lang="ts">
import type { Plant } from '#shared/types/database'
import { HEALTH_BADGE_CLASSES, HEALTH_ICONS } from '#shared/constants/plants'
import { taskOverdueDays } from '#shared/utils/care/taskDue'

const props = withDefaults(defineProps<{
  plant: Plant
  photoSrc?: string | null
  archived?: boolean
  /** due_at of the pending water task, if any */
  nextWaterAt?: string | null
  variant?: 'list' | 'grid'
  /** Species is known to be toxic to pets */
  toxicToPets?: boolean
}>(), {
  photoSrc: null,
  archived: false,
  nextWaterAt: null,
  variant: 'list',
  toxicToPets: false
})

const { t } = useI18n()
const { healthLabel, archiveReasonLabel } = usePlantEnumLabels()

const water = computed(() => {
  if (props.archived || !props.nextWaterAt) return null
  const overdue = taskOverdueDays(props.nextWaterAt)
  if (overdue > 0) return { label: t('plants.waterOverdueShort', { days: overdue }), tone: 'warning' as const }
  if (overdue === 0) return { label: t('plants.waterToday'), tone: 'primary' as const }
  return { label: t('plants.waterInDays', { days: -overdue }, -overdue), tone: 'neutral' as const }
})

const WATER_TONE_CLASSES = {
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary',
  neutral: 'bg-elevated text-muted ring-1 ring-inset ring-default'
} as const

/** Healthy plants get a quiet icon; anything else shows icon + label so colour is never the only cue. */
const showHealthLabel = computed(() => !props.archived && props.plant.health_status !== 'healthy')
</script>

<template>
  <NuxtLink
    v-if="variant === 'grid'"
    :to="`/plants/${plant.id}`"
    class="group flex h-full flex-col overflow-hidden rounded-2xl border border-default bg-elevated/50 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
    :class="archived ? 'opacity-70' : ''"
  >
    <div class="relative aspect-square w-full overflow-hidden bg-primary/5">
      <img
        v-if="photoSrc"
        :src="photoSrc"
        alt=""
        loading="lazy"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
      >
      <div
        v-else
        class="flex size-full items-center justify-center"
      >
        <PlantsPlantAvatar
          :name="plant.name"
          size="xl"
        />
      </div>
      <span
        v-if="water"
        class="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium backdrop-blur-md"
        :class="WATER_TONE_CLASSES[water.tone]"
      >
        <UIcon
          name="i-lucide-droplets"
          class="size-3.5"
        />
        {{ water.label }}
      </span>
      <span
        v-if="showHealthLabel"
        class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium backdrop-blur-md"
        :class="HEALTH_BADGE_CLASSES[plant.health_status]"
      >
        <UIcon
          :name="HEALTH_ICONS[plant.health_status]"
          class="size-3.5"
        />
        {{ healthLabel(plant.health_status) }}
      </span>
      <span
        v-if="toxicToPets"
        class="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-1 text-xs font-medium text-warning backdrop-blur-md"
        :title="t('plants.toxicToPets')"
      >
        <UIcon
          name="i-lucide-paw-print"
          class="size-3.5"
        />
        <span class="sr-only">{{ t('plants.toxicToPets') }}</span>
      </span>
    </div>
    <div class="min-w-0 p-3">
      <p class="truncate font-semibold text-highlighted">
        {{ plant.name }}
      </p>
      <p
        v-if="plant.species"
        class="truncate text-xs italic text-muted"
      >
        {{ plant.species }}
      </p>
      <p
        v-if="plant.site?.name"
        class="mt-1 flex items-center gap-1 text-xs text-muted"
      >
        <UIcon
          name="i-lucide-map-pin"
          class="size-3 shrink-0"
        />
        <span class="truncate">{{ plant.site.name }}</span>
      </p>
      <span
        v-if="archived && plant.archive_reason"
        class="mt-1 inline-block rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs font-medium text-muted"
      >
        {{ archiveReasonLabel(plant.archive_reason) }}
      </span>
      <span
        v-if="!showHealthLabel && !archived"
        class="sr-only"
      >{{ healthLabel(plant.health_status) }}</span>
    </div>
  </NuxtLink>

  <NuxtLink
    v-else
    :to="`/plants/${plant.id}`"
    class="flex items-center gap-3 rounded-2xl border border-default bg-elevated/50 p-2.5 pr-3 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:bg-elevated hover:shadow-lg hover:shadow-primary/5"
    :class="archived ? 'opacity-70' : ''"
  >
    <PlantsPlantAvatar
      :name="plant.name"
      :photo-src="photoSrc"
    />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <p class="truncate font-semibold text-highlighted">
          {{ plant.name }}
        </p>
        <span
          v-if="archived && plant.archive_reason"
          class="shrink-0 rounded-full bg-neutral-500/15 px-2 py-0.5 text-xs font-medium text-muted"
        >
          {{ archiveReasonLabel(plant.archive_reason) }}
        </span>
      </div>
      <p
        v-if="plant.species"
        class="truncate text-sm italic text-muted"
      >
        {{ plant.species }}
      </p>
      <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
        <span
          v-if="water"
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
          :class="WATER_TONE_CLASSES[water.tone]"
        >
          <UIcon
            name="i-lucide-droplets"
            class="size-3.5"
          />
          {{ water.label }}
        </span>
        <span
          v-if="showHealthLabel"
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
          :class="HEALTH_BADGE_CLASSES[plant.health_status]"
        >
          <UIcon
            :name="HEALTH_ICONS[plant.health_status]"
            class="size-3.5"
          />
          {{ healthLabel(plant.health_status) }}
        </span>
        <span
          v-else-if="!archived"
          class="sr-only"
        >{{ healthLabel(plant.health_status) }}</span>
        <span
          v-if="toxicToPets"
          class="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning"
        >
          <UIcon
            name="i-lucide-paw-print"
            class="size-3.5"
          />
          {{ t('plants.toxicShort') }}
        </span>
        <span
          v-if="plant.site?.name"
          class="inline-flex items-center gap-1 text-muted"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-3"
          />
          {{ plant.site.name }}
        </span>
      </div>
    </div>
    <UIcon
      name="i-lucide-chevron-right"
      class="shrink-0 text-muted"
    />
  </NuxtLink>
</template>
