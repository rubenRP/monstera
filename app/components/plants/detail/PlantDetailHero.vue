<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Plant } from '#shared/types/database'
import { HEALTH_BADGE_CLASSES, HEALTH_ICONS } from '#shared/constants/plants'

defineProps<{
  plant: Plant
  photoSrc: string | null
  menuItems: DropdownMenuItem[][]
}>()

const { t } = useI18n()
const { healthLabel } = usePlantEnumLabels()
</script>

<template>
  <header class="relative -mx-4 -mt-4 overflow-hidden md:mx-0 md:mt-0 md:rounded-3xl">
    <div
      v-if="photoSrc"
      class="relative aspect-[4/3] w-full md:aspect-[16/9]"
    >
      <img
        :src="photoSrc"
        :alt="plant.name"
        class="size-full object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
    </div>
    <div
      v-else
      class="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-transparent md:h-52"
    >
      <PlantsPlantAvatar
        :name="plant.name"
        size="xl"
        class="-mt-10 shadow-lg"
      />
    </div>

    <div
      class="absolute inset-x-0 bottom-0 px-4 pb-4 md:px-6"
      :class="photoSrc ? 'text-white' : ''"
    >
      <div class="flex items-end gap-2">
        <div class="min-w-0 flex-1">
          <h1
            class="truncate text-2xl font-bold tracking-tight md:text-3xl"
            :class="photoSrc ? 'text-white drop-shadow' : 'text-highlighted'"
          >
            {{ plant.name }}
          </h1>
          <p
            v-if="plant.species"
            class="truncate text-sm italic"
            :class="photoSrc ? 'text-white/85' : 'text-muted'"
          >
            {{ plant.species }}
          </p>
        </div>
        <span
          class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md"
          :class="HEALTH_BADGE_CLASSES[plant.health_status]"
        >
          <UIcon
            :name="HEALTH_ICONS[plant.health_status]"
            class="size-3.5"
          />
          {{ healthLabel(plant.health_status) }}
        </span>
      </div>
    </div>

    <UDropdownMenu
      :items="menuItems"
      :content="{ align: 'end' }"
    >
      <UButton
        icon="i-lucide-ellipsis-vertical"
        color="neutral"
        variant="outline"
        class="absolute right-3 top-3 rounded-full bg-default/85 text-highlighted shadow-sm backdrop-blur-md"
        :aria-label="t('plants.moreActionsAria')"
      />
    </UDropdownMenu>
  </header>
</template>
