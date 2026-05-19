<script setup lang="ts">
import type { SpeciesProfile } from '#shared/types/species'
import { isUnavailableField } from '#shared/utils/species/profileCompleteness'

const props = defineProps<{
  profile: SpeciesProfile
}>()

const { t, locale } = useI18n()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'es') as 'es' | 'en')

const chips = computed(() => {
  const items: { label: string, icon: string, tone?: 'red' | 'amber' | 'primary' | 'neutral' }[] = []
  const p = props.profile

  if (!isUnavailableField(p.light, loc.value)) {
    const firstLine = p.light.split('\n')[0]?.replace(/^[^:]+:\s*/, '') ?? p.light
    items.push({ label: firstLine.slice(0, 24), icon: 'i-lucide-sun', tone: 'amber' })
  }

  if (!isUnavailableField(p.humidity, loc.value)) {
    const short = p.humidity.split(/[.!]/)[0]?.slice(0, 20) ?? p.humidity
    items.push({ label: short, icon: 'i-lucide-cloud-rain', tone: 'primary' })
  }

  if (!isUnavailableField(p.toxicity, loc.value)) {
    const toxic = p.toxicity.toLowerCase().includes(t('species.toxic').toLowerCase())
    items.push({
      label: toxic ? t('species.toxic') : t('species.nonToxic'),
      icon: toxic ? 'i-lucide-skull' : 'i-lucide-check',
      tone: toxic ? 'red' : 'primary'
    })
  }

  return items.slice(0, 4)
})

const toneClass = {
  red: 'border-red-500/30 text-red-600 dark:text-red-400',
  amber: 'border-amber-500/30 text-amber-700 dark:text-amber-400',
  primary: 'border-primary/30 text-primary',
  neutral: 'border-default text-muted'
}
</script>

<template>
  <div
    v-if="chips.length"
    class="flex gap-2 overflow-x-auto pb-1"
  >
    <div
      v-for="(chip, i) in chips"
      :key="i"
      class="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border bg-elevated/50 px-3 py-2 min-w-[4.5rem]"
      :class="toneClass[chip.tone ?? 'neutral']"
    >
      <UIcon
        :name="chip.icon"
        class="size-5"
      />
      <span class="text-[10px] font-medium text-center leading-tight max-w-[5rem] truncate">
        {{ chip.label }}
      </span>
    </div>
  </div>
</template>
