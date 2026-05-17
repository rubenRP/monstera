<script setup lang="ts">
import type { CareTask } from '#shared/types/database'

const props = defineProps<{
  plantId: string
}>()

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const { fetchCareHistory, taskLabel, taskIcon } = useCareTasks()

const loading = ref(false)
const history = ref<CareTask[]>([])
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

function statusLabel(status: CareTask['status']): string {
  return status === 'done' ? t('plants.historyDone') : t('plants.historySkipped')
}

function statusColor(status: CareTask['status']): 'success' | 'neutral' {
  return status === 'done' ? 'success' : 'neutral'
}

async function load() {
  loading.value = true
  try {
    history.value = await fetchCareHistory(props.plantId)
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
        v-for="task in history"
        :key="task.id"
        class="flex items-center gap-3 p-3 rounded-lg border border-default"
      >
        <UIcon
          :name="taskIcon(task.type)"
          class="w-5 h-5 text-primary shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">
            {{ taskLabel(task.type) }}
          </p>
          <p class="text-xs text-muted">
            {{ formatDate(task.completed_at) }}
          </p>
        </div>
        <UBadge
          :color="statusColor(task.status)"
          size="sm"
          variant="subtle"
        >
          {{ statusLabel(task.status) }}
        </UBadge>
      </li>
    </ul>
  </div>
</template>
