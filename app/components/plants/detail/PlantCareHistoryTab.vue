<script setup lang="ts">
import {
  mergeCareHistory,
  usePlantCheckIns,
  type CareHistoryEntry
} from '~/composables/usePlantCheckIns'

const props = defineProps<{
  plantId: string
}>()

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const { fetchCareHistory, taskLabel, taskIcon } = useCareTasks()
const { fetchCheckInHistory, observationSummary } = usePlantCheckIns()

const loading = ref(false)
const history = ref<CareHistoryEntry[]>([])
const loaded = ref(false)

function formatDate(iso: string | null): string {
  if (!iso) return t('common.none')
  return new Date(iso).toLocaleDateString(dateLocale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function statusLabel(entry: CareHistoryEntry): string {
  if (entry.kind === 'check_in') return t('plants.historyCheckIn')
  return entry.task.status === 'done' ? t('plants.historyDone') : t('plants.historySkipped')
}

function statusColor(entry: CareHistoryEntry): 'success' | 'neutral' {
  if (entry.kind === 'check_in') return 'success'
  return entry.task.status === 'done' ? 'success' : 'neutral'
}

function entryIcon(entry: CareHistoryEntry): string {
  if (entry.kind === 'check_in') return 'i-lucide-clipboard-check'
  return taskIcon(entry.task.type)
}

function entryTitle(entry: CareHistoryEntry): string {
  if (entry.kind === 'check_in') return t('care.taskCheckIn')
  return taskLabel(entry.task.type)
}

function entrySubtitle(entry: CareHistoryEntry): string {
  if (entry.kind === 'check_in') {
    const parts = observationSummary(entry.checkIn)
    if (parts.length) return parts.join(' · ')
    return entry.checkIn.notes?.trim() || ''
  }
  return ''
}

async function load() {
  loading.value = true
  try {
    const [tasks, checkIns] = await Promise.all([
      fetchCareHistory(props.plantId),
      fetchCheckInHistory(props.plantId)
    ])
    history.value = mergeCareHistory(tasks, checkIns)
  } finally {
    loading.value = false
    loaded.value = true
  }
}

onMounted(() => {
  void load()
})

defineExpose({ load })
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-14"
      />
    </div>

    <UAlert
      v-else-if="loaded && !history.length"
      color="neutral"
      icon="i-lucide-history"
      :title="t('plants.historyEmptyTitle')"
      :description="t('plants.historyEmpty')"
    />

    <ul
      v-else-if="loaded"
      class="space-y-2"
    >
      <li
        v-for="entry in history"
        :key="entry.kind === 'check_in' ? entry.checkIn.id : entry.task.id"
        class="flex items-center gap-3 p-3 rounded-lg border border-default"
      >
        <UIcon
          :name="entryIcon(entry)"
          class="w-5 h-5 shrink-0 text-primary"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">
            {{ entryTitle(entry) }}
          </p>
          <p
            v-if="entrySubtitle(entry)"
            class="text-xs text-muted truncate"
          >
            {{ entrySubtitle(entry) }}
          </p>
          <p class="text-xs text-muted">
            {{ formatDate(entry.at) }}
          </p>
        </div>
        <UBadge
          :color="statusColor(entry)"
          variant="subtle"
          size="sm"
        >
          {{ statusLabel(entry) }}
        </UBadge>
      </li>
    </ul>
  </div>
</template>
