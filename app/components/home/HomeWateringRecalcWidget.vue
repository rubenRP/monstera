<script setup lang="ts">
import type { WateringRecalcEvent } from '#shared/types/database'

defineProps<{
  events: WateringRecalcEvent[]
  loading?: boolean
}>()

const emit = defineEmits<{
  dismiss: [id: string]
  dismissAll: []
}>()

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const open = ref(true)

function sourceLabel(source: WateringRecalcEvent['source']) {
  return t(`home.recalcSource.${source}`)
}

function formatDueAt(value: string | null) {
  if (!value) return t('home.recalcNoPreviousDue')
  return new Date(value).toLocaleDateString(dateLocale.value, {
    day: 'numeric',
    month: 'short'
  })
}

function formatInterval(days: number | null) {
  if (days == null) return t('home.recalcNoPreviousInterval')
  return t('home.recalcIntervalDays', { days })
}

function formatWhen(createdAt: string) {
  return new Date(createdAt).toLocaleString(dateLocale.value, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <UCollapsible
    v-if="events.length || loading"
    v-model:open="open"
    class="group"
  >
    <UCard :ui="{ body: 'p-0' }">
      <UCollapsibleTrigger
        class="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div class="flex items-center gap-2 min-w-0">
          <UIcon
            name="i-lucide-history"
            class="w-5 h-5 shrink-0 text-info"
          />
          <div class="min-w-0">
            <p class="font-medium text-sm">
              {{ t('home.recalcTitle') }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ t('home.recalcSubtitle') }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UBadge
            v-if="events.length"
            color="info"
            variant="subtle"
          >
            {{ events.length }}
          </UBadge>
          <UIcon
            name="i-lucide-chevron-down"
            class="w-4 h-4 text-muted transition-transform group-data-[state=open]:rotate-180"
          />
        </div>
      </UCollapsibleTrigger>

      <UCollapsibleContent>
        <div class="border-t border-default px-4 pb-4 pt-3 space-y-3">
          <div
            v-if="loading"
            class="space-y-2"
          >
            <USkeleton class="h-16" />
            <USkeleton class="h-16" />
          </div>

          <template v-else>
            <div
              v-if="events.length > 1"
              class="flex justify-end"
            >
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                @click="emit('dismissAll')"
              >
                {{ t('home.recalcDismissAll') }}
              </UButton>
            </div>

            <ul class="space-y-3">
              <li
                v-for="event in events"
                :key="event.id"
                class="rounded-lg border border-info/20 bg-info/5 p-3 space-y-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <NuxtLink
                      :to="`/plants/${event.plant_id}`"
                      class="font-medium text-sm hover:text-primary"
                    >
                      {{ event.plant_name }}
                    </NuxtLink>
                    <p class="text-xs text-muted mt-0.5">
                      {{ formatWhen(event.created_at) }}
                    </p>
                  </div>
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-x"
                    :aria-label="t('home.recalcDismiss')"
                    @click="emit('dismiss', event.id)"
                  />
                </div>

                <UBadge
                  color="info"
                  variant="subtle"
                  size="sm"
                >
                  {{ sourceLabel(event.source) }}
                </UBadge>

                <dl class="grid gap-1 text-xs">
                  <div class="flex flex-wrap gap-x-1">
                    <dt class="text-muted">
                      {{ t('home.recalcDueLabel') }}:
                    </dt>
                    <dd>
                      {{ formatDueAt(event.previous_due_at) }}
                      <span class="text-muted">→</span>
                      {{ formatDueAt(event.new_due_at) }}
                    </dd>
                  </div>
                  <div class="flex flex-wrap gap-x-1">
                    <dt class="text-muted">
                      {{ t('home.recalcIntervalLabel') }}:
                    </dt>
                    <dd>
                      {{ formatInterval(event.previous_interval_days) }}
                      <span class="text-muted">→</span>
                      {{ formatInterval(event.new_interval_days) }}
                    </dd>
                  </div>
                </dl>
              </li>
            </ul>
          </template>
        </div>
      </UCollapsibleContent>
    </UCard>
  </UCollapsible>
</template>
